# Student Hub authentication
Tags: black-box, ui

## Sign-in page shows the study entry points
* Open the sign in page
* The page shows "Sign in"
* The page shows "Continue"
* The page shows "Create an account"

## Empty sign-in stays on the page
* Open the sign in page
* Submit the sign in form
* The address contains "/auth/signin"

## Wrong password is rejected
* Open the sign in page
* Sign in as "st-student" with password "wrong-password"
* The page shows "Invalid username or password"

## Register page rejects mismatched passwords
* Open the register page
* The page shows "Create account"
* Register user "ststudent" email "ststudent@university.edu" with password "secret-pass" and confirmation "other-pass"
* The page shows "Passwords do not match"

## Register page links back to sign in
* Open the register page
* Follow "Sign in"
* The page shows "Access your library and study tools."
