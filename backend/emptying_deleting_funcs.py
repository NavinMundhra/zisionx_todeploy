import boto3
import os
from concurrent.futures import ThreadPoolExecutor
from dotenv import load_dotenv
import json


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

def empty_dynamodb_table(table_name):
    """
    Empty the DynamoDB table by deleting all items, handling pagination.
    """
    try:
        print(f"Emptying DynamoDB table: {table_name}...")

        # Initialize the scan response
        scan_kwargs = {"TableName": table_name}
        while True:
            # Scan the table to get items
            scan_response = dynamodb.scan(**scan_kwargs)
            items = scan_response.get("Items", [])

            if not items:
                print(f"No more items to delete from {table_name}.")
                break

            # Delete items in parallel
            with ThreadPoolExecutor(max_workers=10) as executor:
                for item in items:
                    executor.submit(delete_item, table_name, item)

            # Check if there are more items to retrieve
            if "LastEvaluatedKey" in scan_response:
                scan_kwargs["ExclusiveStartKey"] = scan_response["LastEvaluatedKey"]
            else:
                break

        print(f"DynamoDB table '{table_name}' is now empty.")
    except Exception as e:
        print(f"Error emptying DynamoDB table: {e}")


def delete_item(table_name, item, max_retries=3):
    """
    Delete a single item from the DynamoDB table with retries.
    """
    face_id = item["FaceId"]["S"]
    external_image_id = item["ExternalImageId"]["S"]

    for attempt in range(max_retries):
        try:
            # Delete the item
            dynamodb.delete_item(
                TableName=table_name,
                Key={
                    "FaceId": {"S": face_id},
                    "ExternalImageId": {"S": external_image_id}
                }
            )
            print(f"Deleted item with FaceId: {face_id} and ExternalImageId: {external_image_id}")
            return
        except Exception as e:
            print(f"Error deleting item (attempt {attempt + 1}): {e}")
            if attempt == max_retries - 1:
                print(f"Failed to delete item with FaceId: {face_id}")

def empty_collection(collection_id):
    """
    Empty the Rekognition collection by deleting all faces.
    """
    try:
        # List all faces in the collection
        face_ids = []
        response = rekognition.list_faces(CollectionId=collection_id)

        while True:
            face_ids.extend([face["FaceId"] for face in response.get("Faces", [])])

            # Check if there are more faces to list
            if "NextToken" in response:
                response = rekognition.list_faces(CollectionId=collection_id, NextToken=response["NextToken"])
            else:
                break

        if not face_ids:
            print(f"No faces found in collection '{collection_id}'.")
            return

        # Delete all faces from the collection
        print(f"Deleting {len(face_ids)} faces from collection '{collection_id}'...")
        delete_response = rekognition.delete_faces(CollectionId=collection_id, FaceIds=face_ids)
        print(f"Deleted Face IDs: {delete_response.get('DeletedFaces', [])}")
        print(f"Collection '{collection_id}' is now empty.")

    except Exception as e:
        print(f"Error emptying collection: {e}")


def empty_collection_and_dynamodb(collection_id, table_name):
    """
    Empty both the Rekognition collection and the DynamoDB table.
    """
    empty_collection(collection_id)
    empty_dynamodb_table(table_name)
