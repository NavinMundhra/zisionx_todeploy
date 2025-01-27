from app import compress_image  # Import compress_image from app.py
import boto3
import os
from dotenv import load_dotenv
from PIL import Image
import io
import sys
from concurrent.futures import ThreadPoolExecutor

# Load environment variables
load_dotenv()

S3_BUCKET = os.getenv("S3_BUCKET")
AWS_REGION = os.getenv("AWS_REGION")

# Initialize AWS S3 client
s3 = boto3.client("s3", region_name=AWS_REGION)

def process_and_upload(file_path, s3_path):
    """
    Compress the image and upload it to S3.
    """
    try:
        # Compress the image
        print(f"Compressing {file_path}...")
        with open(file_path, "rb") as image_file:
            compressed_image = compress_image(image_file)  # Compress the image

        # Upload the compressed image to S3
        print(f"Uploading {s3_path}...")
        s3.upload_fileobj(compressed_image, S3_BUCKET, s3_path)

        print(f"Uploaded: {s3_path}")
    except Exception as e:
        print(f"Error processing {file_path}: {e}")

def upload_folder(folder_path):
    """
    Compress and upload all images in the given folder path using parallel processing.
    """
    tasks = []
    with ThreadPoolExecutor() as executor:
        for root, dirs, files in os.walk(folder_path):
            for filename in files:
                if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                    file_path = os.path.join(root, filename)
                    s3_path = f"{PHONE_NUMBER}/{filename}"

                    # Schedule the task for parallel execution
                    tasks.append(executor.submit(process_and_upload, file_path, s3_path))

    # Wait for all tasks to complete
    for task in tasks:
        task.result()

    print("All files uploaded.")

if __name__ == "__main__":
    # Check if folder_path is provided as a command-line argument
    if len(sys.argv) < 3:
        print("Usage: python upload_folder.py <folder_path> <countrycode_phone_number>")
        sys.exit(1)

    folder_path = sys.argv[1]
    PHONE_NUMBER = sys.argv[2]
    if not os.path.exists(folder_path):
        print(f"Error: The folder path '{folder_path}' does not exist.")
        sys.exit(1)

    # Start the upload process
    print(f"Starting upload for folder: {folder_path}")
    upload_folder(folder_path) 