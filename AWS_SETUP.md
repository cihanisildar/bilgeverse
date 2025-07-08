# AWS S3 Setup Guide

## Required Environment Variables

Add these to your `.env.local` file (for development) and your production environment variables:

```env
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket-name-here
```

## AWS S3 Bucket Setup

1. **Create an S3 Bucket:**
   - Go to AWS S3 Console
   - Click "Create bucket"
   - Choose a unique bucket name
   - Select your preferred region
   - Keep default settings for nowchec

2. **Configure Bucket for Public Access:**
   - Go to your bucket → Permissions tab
   - Edit "Block public access" settings
   - Uncheck "Block all public access" (since we need public read access for images)
   - Save changes

3. **Update Bucket Policy:**
   - In Permissions tab, click "Bucket policy"
   - Add this policy (replace `your-bucket-name` with your actual bucket name):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::your-bucket-name/*"
        }
    ]
}
```

4. **Create IAM User:**
   - Go to IAM Console → Users → Create user
   - Give it a name like "bilgeverse-s3-upload"
   - Attach this policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:PutObjectAcl",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::your-bucket-name/*"
        }
    ]
}
```

5. **Get Access Keys:**
   - Go to the user → Security credentials tab
   - Create access key
   - Copy the Access Key ID and Secret Access Key
   - Add them to your environment variables

## Testing

After setup, your image uploads will be stored in S3 and return URLs like:
`https://your-bucket-name.s3.us-east-1.amazonaws.com/store/1751975391054_o6d7a7.webp` 