DATABASE_URL=$1
JWT_SECRET=$2
TWILIO_AUTH_TOKEN=$3
TWILIO_PHONE=$4
TWILIO_SID=$5
RESEND_KEY=$5

# STOP CURRENT PROCESS
docker stop recipes_container
docker rm recipes_container
docker rmi recipes_image

# GET CODE
git pull

# BUILD NEW IMAGE
docker build \
--build-arg DATABASE_URL="$DATABASE_URL" \
--build-arg JWT_SECRET="$JWT_SECRET" \
--build-arg TWILIO_AUTH_TOKEN="$TWILIO_AUTH_TOKEN" \
--build-arg TWILIO_PHONE="$TWILIO_PHONE" \
--build-arg TWILIO_SID="$TWILIO_SID" \
--build-arg RESEND_KEY="$RESEND_KEY" \
-t recipes_image .

# RUN NEW IMAGE
docker run -p 4500:4500 --name recipes_container -d recipes_image
