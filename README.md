# blog_microservice
A blog microservice API built with node/express with depencies on  for publishing and subscribing , redis for caching , docker and docker compose


----------------------DESCRIPTION--------------------------

This is a microservice API , that is each service is differently and strictly decoupled.
There are 5 main services(You can decide to extend it, folder structure is clear enough to ink this).
These services have common critical core libraries like ioredis for caching , rabbitmq for message queue publishing and subscribing.



                    -------------------- HOW TO USE -------------------

1. BASE URL
                     
- THE BASE ENTRY POINT IS THE http://localhost:3000(Which is the API-GATEWAY).
- This is re-routed to other services automatically.

2. AUTHENTICATION AND AUTHORIZATION
- JWT authentication (accessToken and refreshToken)

3. ERROR HANDLING

Common status codes with meanings ( 400 Bad Request, 401 Unauthorized, 500 internal server error, 429 Too many request(rate limitting)).

Sample error responses.
