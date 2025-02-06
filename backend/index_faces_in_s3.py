import boto3
import os
from concurrent.futures import ThreadPoolExecutor
from dotenv import load_dotenv
import json
from emptying_deleting_funcs import empty_collection_and_dynamodb

# Load environment variables
load_dotenv()

# AWS Configuration
S3_BUCKET = os.getenv("S3_BUCKET")  # Replace with your S3 bucket name
COLLECTION_ID = os.getenv("COLLECTION_ID")  # Replace with your Rekognition collection ID
AWS_REGION = os.getenv("AWS_REGION")  # Replace with your AWS region (e.g., "us-east-1")
DYNAMODB_TABLE = os.getenv("DYNAMODB_TABLE")

# Initialize AWS clients
s3 = boto3.client("s3", region_name=AWS_REGION)
rekognition = boto3.client("rekognition", region_name=AWS_REGION)
dynamodb = boto3.client("dynamodb", region_name=AWS_REGION)


def store_face_attributes_in_dynamodb(face_id, external_image_id, face_detail, s3_path):
    """
    Store face attributes in DynamoDB.
    """
    try:
        # Extract face attributes
        eyes_open = face_detail.get("EyesOpen", {}).get("Value", None)
        eyes_open_confidence = face_detail.get("EyesOpen", {}).get("Confidence", None)
        smile = face_detail.get("Smile", {}).get("Value", None)
        smile_confidence = face_detail.get("Smile", {}).get("Confidence", None)
        emotions = face_detail.get("Emotions", [])
        mouth_open = face_detail.get("MouthOpen", {}).get("Value", None)
        mouth_open_confidence = face_detail.get("MouthOpen", {}).get("Confidence", None)
        age_range = face_detail.get("AgeRange", {})
        gender = face_detail.get("Gender", {}).get("Value", None)
        gender_confidence = face_detail.get("Gender", {}).get("Confidence", None)

        # Store in DynamoDB
        dynamodb.put_item(
            TableName=DYNAMODB_TABLE,
            Item={
                "FaceId": {"S": face_id},
                "ExternalImageId": {"S": external_image_id},
                "S3Path": {"S": s3_path},
                "EyesOpen": {"BOOL": eyes_open},
                "EyesOpenConfidence": {"N": str(eyes_open_confidence)},
                "Smile": {"BOOL": smile},
                "SmileConfidence": {"N": str(smile_confidence)},
                "Emotions": {"S": json.dumps(emotions)},  # Store emotions as JSON
                "MouthOpen": {"BOOL": mouth_open},
                "MouthOpenConfidence": {"N": str(mouth_open_confidence)},
                "AgeRangeLow": {"N": str(age_range.get("Low", 0))},
                "AgeRangeHigh": {"N": str(age_range.get("High", 0))},
                "Gender": {"S": gender},
                "GenderConfidence": {"N": str(gender_confidence)},
            }
        )
        print(f"Face attributes stored in DynamoDB for FaceId: {face_id}")

    except Exception as e:
        print(f"Error storing attributes in DynamoDB: {e}")


def index_face(bucket_name, collection_id, image_key):
    """
    Index a single face in the given S3 bucket and key.
    """
    try:
        print(f"Indexing face in image: {image_key}")

        # Call Rekognition to index faces
        rekognition_response = rekognition.index_faces(
            CollectionId=collection_id,
            Image={"S3Object": {"Bucket": bucket_name, "Name": image_key}},
            ExternalImageId=image_key.split("/")[-1].split(".")[0],
            DetectionAttributes=["ALL"]
        )

        # Store face attributes in DynamoDB
        for face_record in rekognition_response.get("FaceRecords", []):
            face_id = face_record["Face"]["FaceId"]
            external_image_id = face_record["Face"]["ExternalImageId"]
            face_detail = face_record.get("FaceDetail", {})

            store_face_attributes_in_dynamodb(face_id, external_image_id, face_detail, image_key)

    except Exception as e:
        print(f"Error indexing {image_key}: {e}")


def index_faces_in_s3_path(bucket_name, eventcode, max_workers=10):
    """
    Index all faces in images located in the specified S3 path.
    """
    try:
        # Define the S3 path based on the phone number
        prefix = f"{eventcode}/"

        # List all objects in the specified S3 path
        response = s3.list_objects_v2(Bucket=bucket_name, Prefix=prefix)
        if "Contents" not in response:
            print(f"No images found in the bucket for path: {prefix}")
            return

        # Extract image keys
        image_keys = [obj["Key"] for obj in response["Contents"] if not obj["Key"].endswith("/")]

        # Use parallel processing to index faces
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            executor.map(lambda key: index_face(bucket_name, COLLECTION_ID, key), image_keys)

        print("Face indexing completed for all images.")
    except Exception as e:
        print(f"Error processing bucket {bucket_name} for path {eventcode}: {e}")


if __name__ == "__main__":
    import sys

    # Check if eventcode is provided as a command-line argument
    if len(sys.argv) < 2:
        print("Usage: python index_faces_in_s3.py <eventcode>")
        sys.exit(1)

    EVENT_CODE = sys.argv[1]  # Get phone_number from command-line argument

    print(f"Starting face indexing for phone number: {EVENT_CODE}")
    empty_collection_and_dynamodb(COLLECTION_ID, DYNAMODB_TABLE)
    index_faces_in_s3_path(S3_BUCKET, EVENT_CODE)