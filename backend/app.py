from flask import Flask, request, jsonify
from flask_cors import CORS
import boto3
from PIL import Image
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
import os, io
import time, json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders

# Email configuration
SMTP_SERVER = os.getenv("SMTP_SERVER")  # e.g., "smtp.gmail.com"
SMTP_PORT = os.getenv("SMTP_PORT", 587)  # Default port for TLS
EMAIL_FROM = os.getenv("EMAIL_ADDRESS")  # Your email address
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")  # Your email password

EMAIL_TO = "mundranavin@gmail.com"

load_dotenv()
app = Flask(__name__)
CORS(app)  # Allow cross-origin requests from your frontend

# AWS Configuration
S3_BUCKET = os.getenv("S3_BUCKET")
AWS_REGION = os.getenv("AWS_REGION")   
S3 = boto3.client('s3', region_name=AWS_REGION)
COLLECTION_ID = os.getenv("COLLECTION_ID")
REKOGNITION = boto3.client("rekognition", region_name=AWS_REGION)
DYNAMODB = boto3.client("dynamodb", region_name=AWS_REGION)
DYNAMODB_TABLE = os.getenv("DYNAMODB_TABLE")  # Replace with your DynamoDB table name


MAX_IMAGE_SIZE = 2 ## Maximum image compression limit
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png'} ## Allowed file extensions

def allowed_file(filename):
    """Check if the file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Compress image to below 5MB
def compress_image(file, max_size_mb=5):
    max_size_bytes = max_size_mb * 1024 * 1024  # Convert MB to bytes
    img = Image.open(file)
    img_format = img.format  # Preserve original format (e.g., JPEG, PNG)

    # Reduce quality or resize
    quality = 85  # Start with a high quality
    while True:
        # Save image to an in-memory buffer
        buffer = io.BytesIO()
        img.save(buffer, format=img_format, quality=quality)
        size = buffer.tell()

        if size <= max_size_bytes or quality <= 20:  # Stop if size < 5MB or quality is too low
            break

        # Reduce quality
        quality -= 5

    buffer.seek(0)  # Reset buffer position for reading
    return buffer


@app.route('/api/upload', methods=['POST'])
def upload_image():
    """Upload an image to the S3 bucket, index it in Rekognition, and store attributes in DynamoDB.
    curl -X POST http://127.0.0.1:5000/upload -F "file=@test-images/file_1.JPG" -F "eventcode=919051657004"
    """
    try:
        print("request: ", request.form)
        file = request.files['file']  # Get the uploaded file
        print("file received: ", request.form)
        eventcode = request.form['eventcode']  # Get the eventcode
        filename = secure_filename(file.filename)  # Sanitize the filename

        file = compress_image(file)  # Compress the image if needed

        if not allowed_file(filename):
            return jsonify({"error": "Invalid file format. Only JPG and PNG are supported."}), 400

        # Define the S3 object path
        s3_path = f"{eventcode}/{filename}"

        # Upload the file to S3
        S3.upload_fileobj(file, S3_BUCKET, s3_path)
        print("S3 upload complete")

        # Index the face in Rekognition
        response = REKOGNITION.index_faces(
            CollectionId=COLLECTION_ID,
            Image={"S3Object": {"Bucket": S3_BUCKET, "Name": s3_path}},
            ExternalImageId=filename.split("/")[-1].split(".")[0],
            DetectionAttributes=["ALL"]
        )

        # Extract attributes and store them in DynamoDB
        for face_record in response.get("FaceRecords", []):
            face = face_record["Face"]
            face_detail = face_record.get("FaceDetail", {})

            # Extract attributes
            face_id = face["FaceId"]
            external_image_id = face["ExternalImageId"]
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
            DYNAMODB.put_item(
                TableName=DYNAMODB_TABLE,
                Item={
                    "FaceId": {"S": face_id},
                    "ExternalImageId": {"S": external_image_id},
                    "S3Path": {"S": s3_path},  # Store S3 path for generating pre-signed URL
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
                    "GenderConfidence": {"N": str(gender_confidence)}
                }
            )
            print(f"Face {face_id} attributes stored in DynamoDB.")

        return jsonify({"message": "Image uploaded and face indexed successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/search', methods=['POST'])
def search_face():
    """Search for a face, retrieve attributes from DynamoDB, and return a pre-signed URL for the matched image."""
    try:
        print("request: ", request)
        file = request.files['file']  # Get the uploaded file
        filename = secure_filename(file.filename)
        local_path = f"/tmp/{filename}"
        file.save(local_path)

        # Search for the face in Rekognition
        with open(local_path, "rb") as image_file:
            search_response = REKOGNITION.search_faces_by_image(
                CollectionId=COLLECTION_ID,
                Image={"Bytes": image_file.read()},
                MaxFaces=100,
                FaceMatchThreshold=90
            )

        if not search_response.get("FaceMatches"):
            return jsonify({"matches": []}), 200

        matches = []
        for match in search_response["FaceMatches"]:
            face = match["Face"]
            face_id = face["FaceId"]
            external_image_id = face["ExternalImageId"]
            similarity = match["Similarity"]

            # Retrieve attributes from DynamoDB
            dynamo_response = DYNAMODB.get_item(
                TableName=DYNAMODB_TABLE,
                Key={
                    "FaceId": {"S": face_id},
                    "ExternalImageId": {"S": external_image_id}
                }
            )

            if "Item" in dynamo_response:
                attributes = dynamo_response["Item"]
                s3_path = attributes["S3Path"]["S"]  # Retrieve the S3 path

                # Extract face attributes
                eyes_open = attributes["EyesOpen"]["BOOL"]
                eyes_open_confidence = float(attributes["EyesOpenConfidence"]["N"])
                emotions = json.loads(attributes["Emotions"]["S"])

                # Check if the eyes are open with high confidence
                if not eyes_open or eyes_open_confidence < 98:
                    continue

                # Check if the face has the desired emotions with confidence above 95%
                valid_emotion = any(
                    emotion["Type"] in ["CALM", "HAPPY", "SAD"] and emotion["Confidence"] >= 80
                    for emotion in emotions
                )
                if not valid_emotion:
                    continue

                # Generate pre-signed URL for the matched image
                presigned_url = S3.generate_presigned_url(
                    ClientMethod="get_object",
                    Params={"Bucket": S3_BUCKET, "Key": s3_path},
                    ExpiresIn=3600  # URL valid for 1 hour
                )

                match_detail = {
                    "face_id": face_id,
                    "similarity": similarity,
                    "image_name": external_image_id,
                    "presigned_url": presigned_url,  # Add pre-signed URL to response
                    "eyes_open": eyes_open,
                    "eyes_open_confidence": eyes_open_confidence,
                    "emotions": emotions,
                    "mouth_open": attributes["MouthOpen"]["BOOL"],
                    "mouth_open_confidence": float(attributes["MouthOpenConfidence"]["N"]),
                    "age_range": {
                        "Low": int(attributes["AgeRangeLow"]["N"]),
                        "High": int(attributes["AgeRangeHigh"]["N"])
                    },
                    "gender": attributes["Gender"]["S"],
                    "gender_confidence": float(attributes["GenderConfidence"]["N"])
                }
                matches.append(match_detail)

        return jsonify({"matches": matches}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
        
# Dummy OTP (0000) for testing purposes
OTP = "0000"

@app.route('/api/send-otp', methods=['POST'])
def send_otp():
    try:
        # Parse the request data
        data = request.get_json()
        phone_number = data.get("phone_number")
        if not phone_number:
            return jsonify({"error": "Phone number is required"}), 400

        # Simulate sending the OTP
        print(f"Sending OTP {OTP} to phone number: {phone_number}")

        # Respond with success
        return jsonify({"message": "OTP sent successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500



@app.route('/api/validate-otp', methods=['POST'])
def validate_otp():
    try:
        # Parse the request data
        data = request.get_json()
        phone_number = data.get("phone_number")
        otp = data.get("otp")

        if not phone_number or not otp:
            return jsonify({"error": "Phone number and OTP are required"}), 400

        # Validate the OTP
        stored_otp = "0000"
        if stored_otp is None:
            return jsonify({"error": "OTP not found for this phone number"}), 404

        if stored_otp != otp:
            return jsonify({"error": "Invalid OTP"}), 401

        # If OTP is valid, respond with success
        print(f"OTP validated for phone number: {phone_number}")
        return jsonify({"message": "OTP validated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/print-it', methods=['POST'])
def print_it():
    """
    Endpoint to handle print requests. 
    Accepts phone_number and event_code as input and processes the print request.
    """
    try:
        # Parse the request data
        data = request.get_json()
        phone_number = data.get("phone_number")
        event_code = data.get("event_code")
        image_name = data.get("image_name")

        # Validate the input data
        if not phone_number or not event_code or not image_name:
            return jsonify({"error": "Phone number and image name are required"}), 400

        # Construct the S3 path of the image
        s3_path = f"{event_code}/{image_name}.JPG"

        # Generate a pre-signed URL for the image
        presigned_url = S3.generate_presigned_url(
            ClientMethod="get_object",
            Params={"Bucket": S3_BUCKET, "Key": s3_path},
            ExpiresIn=3600  # URL valid for 1 hour
        )

        # Download the image from S3
        file_content = S3.get_object(Bucket=S3_BUCKET, Key=s3_path)['Body'].read()
        local_filename = f"/tmp/{image_name}.JPG"

        # Save the file locally
        with open(local_filename, "wb") as file:
            file.write(file_content)
        
        test_smtp_connection()

        # Send the email
        send_email_with_attachment(
            phone_number=phone_number,
            event_code=event_code,
            file_path=local_filename,
            file_name=image_name
        )
        # Simulate printing logic (you can integrate a real printing service here)
        print(f"Print request received for phone number: {phone_number}, image: {image_name}")
        print(f"Pre-signed URL for the image: {presigned_url}")

        # Return success response
        return jsonify({"message": "Print request successful", "presigned_url": presigned_url}), 200

    except Exception as e:
        # Handle any errors that occur
        print(f"Error in print-it API: {e}")
        return jsonify({"error": str(e)}), 500

def test_smtp_connection():
    import smtplib
    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(EMAIL_FROM, EMAIL_PASSWORD)
            print("SMTP connection successful!")
    except Exception as e:
        print(f"SMTP connection failed: {e}")


def send_email_with_attachment(phone_number, event_code, file_path, file_name):
    try:
        # Setup the email
        subject = "Print Request from ZisionX"
        body = f"Phone Number: {phone_number}\nEvent Code: {event_code}"

        msg = MIMEMultipart()
        msg['From'] = EMAIL_FROM
        msg['To'] = EMAIL_TO
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))

        # Attach the file
        with open(file_path, "rb") as attachment:
            part = MIMEBase('application', 'octet-stream')
            part.set_payload(attachment.read())
            encoders.encode_base64(part)
            part.add_header(
                "Content-Disposition",
                f"attachment; filename={file_name}.JPG",
            )
            msg.attach(part)

        # Connect to Gmail's SMTP server using SSL
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(EMAIL_FROM, EMAIL_PASSWORD)  # Login with your credentials
            server.sendmail(EMAIL_FROM, EMAIL_TO, msg.as_string())
            print("Email sent successfully!")

    except Exception as e:
        print(f"Failed to send email: {e}")
        raise


if __name__ == '__main__':
    app.run(debug=True)