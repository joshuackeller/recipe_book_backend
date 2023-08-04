docker build -t recipes_image .
docker run -p 4500:4500 --name recipes_container -d recipes_image