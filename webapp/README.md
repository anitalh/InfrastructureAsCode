# webapp

This is a node.js and MySQL based application which runs on AWS.

## How to install, run and test the application?
## To install
npm install

## To start the application
node server.js

## To run all the unit tests
npm test


This application runs on port 3000. This is a HTTP based application. When we run node server.js this application can be opened in the browser or we can trigger in the POSTMAN.

It supports Token-Based authentication by providing basic auth.

When creating the user, provide Email Address as username, Password, First Name, Last Name, User data will be stored in database.

For the GET/PUT call, User has to provide username and password as a basic authentication. The password is securely stored with BCrypt password hashing scheme with salt. If the provided user details match, then the response will be displayed for the GET call. For security reasons the password will never be shown in GET call. If the login is not successful, it returns an error unauthorized user

User can update information related to First Name, Last Name, Password. No other fields can be updated by the user. Attempt to update any other field will return 400 Bad Request.

User cannot create an account with existing username i.e emailid. This attempt will return 400 Bad Request.

Existing user can add product. Product quantity cannot be zero or negative. SKU will be unique. Adding 2nd product with the same SKU will return an error.

The user who created the product can update the product. Also, the user who created the product can delete the product.
