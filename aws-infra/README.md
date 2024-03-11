# aws-infra

## To run this application 
terraform init && terraform apply -auto-approve

## To destroy VPC
terraform destroy -auto-approve

## Steps to create Dev and Demo profiles using AWS
> 1. Sign-in to AWS (Dev Account) console
> 2. Create a user with administrative access in IAM
> 3. Go to the Security credentials of the user created, and save the Access key Id and Secret Id
> 4. Repeat step 2 and 3 by signing in to AWS(Demo Account) as well
> 5. Install CLI from https://docs.aws.amazon.com/cli/latest/userguide/awscli-install-linux.html and run aws --version to check if the installation is done right.
> 6. Go to .aws folder
> 7. Now run aws configure --profile=dev
> 8. Enter the Access key ID , Secret Access Key and region and output format of the user in dev account(default region can be the region closest to you.)
> 9. Now run aws configure --profile=demo
> 10. Enter the Access key ID , Secret Access Key and region and output format of the user in demo account((default region can be the region closest to you.)
