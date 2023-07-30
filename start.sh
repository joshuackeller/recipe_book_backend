docker build -t recipes_image .
docker run -p 80:80 --name recipes_container -d recipes_image