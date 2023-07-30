docker build -t recipes_images .
docker run -p 80:80 --name recipes_container -d recipes_images
