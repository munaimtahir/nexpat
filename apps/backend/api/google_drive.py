import io
import os
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
from google.oauth2 import service_account

SCOPES = ["https://www.googleapis.com/auth/drive.file"]


def upload_prescription_image(file_obj):
    """Upload the given file object to Google Drive.

    Returns a tuple of (file_id, webViewLink).
    """
    credentials_path = os.environ.get("GOOGLE_SERVICE_ACCOUNT_FILE")
    if not credentials_path:
        raise RuntimeError("GOOGLE_SERVICE_ACCOUNT_FILE not set")
    creds = service_account.Credentials.from_service_account_file(credentials_path, scopes=SCOPES)
    service = build("drive", "v3", credentials=creds)
    file_metadata = {"name": file_obj.name}
    media = MediaIoBaseUpload(
        io.BytesIO(file_obj.read()),
        mimetype=file_obj.content_type,
    )
    created = (
        service.files()
        .create(body=file_metadata, media_body=media, fields="id, webViewLink")
        .execute()
    )
    return created.get("id"), created.get("webViewLink")
