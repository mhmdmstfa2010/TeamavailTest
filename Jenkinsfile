pipeline {
    agent any

    environment {
        REDIS_HOST     = "redis"
        REDIS_PORT     = "6379"
        REDIS_PASSWORD = "${REDIS_PASSWORD}"
    }

    stages {
        stage('npm install') {
            steps { sh 'npm install' }
        }

        stage('npm format') {
            steps { sh 'npm run format' }
        }

        stage('npm lint') {
            steps { sh 'npm run lint' }
        }

        stage('npm test') {
            steps { sh 'npm run test' }
        }

        stage('npm audit') {
            steps { sh 'npm audit --production' }
        }

        stage('terraform init & apply') {
            steps {
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'AWS_Creds']]) {
                    sh '''
                        cd terraform
                        terraform init
                        terraform apply -auto-approve
                    '''
                    script {
                        env.EC2_IP = sh(script: 'cd terraform && terraform output -raw public_ip', returnStdout: true).trim()
                        echo "EC2 IP: ${env.EC2_IP}"
                    }
                }
            }
        }
        stage('Generate .env') {
            steps {
                withCredentials([
                    string(credentialsId: 'REDIS_PASSWORD', variable: 'REDIS_PASSWORD'),
                ]) {
                    sh '''
                        echo "REDIS_HOST=redis" > .env
                        echo "REDIS_PORT=6379" >> .env
                        echo "REDIS_PASSWORD=$REDIS_PASSWORD" >> .env
                        cat .env
                    '''
                }
            }
        }

        stage('Deploy with docker compose') {
            steps {
                sshagent(['AWS_SSH']) {
                    sh """
                        
                        scp -o StrictHostKeyChecking=no docker-compose.yml ec2-user@${env.EC2_IP}:/home/ec2-user/
                        ssh -o StrictHostKeyChecking=no ec2-user@${env.EC2_IP} '
                            cd /home/ec2-user/
                            docker compose up -d --build
                        '
                    """
                }
            }
        }
    }
}
