pipeline {
    agent any

    environment {
        REDIS_HOST     = "redis"
        REDIS_PORT     = "6379"
        REDIS_PASSWORD = "password"
    }

    stages {
        stage('npm install') {
            steps {
                sh 'npm install'
            }
        }

        stage('npm format') {
            steps {
                sh 'npm run format'
            }
        }

        stage('npm lint') {
            steps {
                sh 'npm run lint'
            }
        }

        stage('npm test') {
            steps {
                sh 'npm run test'
            }
        }

        stage('npm audit') {
            steps {
                sh 'npm audit --production'
            }
        }

        stage('docker build') {
            steps {
                sh 'docker build -t mohamed710/teamavail-app:latest .'
            }
        }

        stage('docker hub login') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'DockerHub_cred', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
                    sh 'docker login -u $DOCKER_USERNAME -p $DOCKER_PASSWORD'
                }
            }
        }

        stage('docker push') {
            steps {
                sh 'docker push mohamed710/teamavail-app:latest'
            }
        }

        stage('terraform init & apply') {
            steps {
                sh '''
                    cd terraform 
                    terraform init
                    terraform apply -auto-approve
                '''
            }
        }

        stage('Deploy with docker compose') {
            steps {
                sshagent(['aws-ssh-key']) {
                    sh '''
                        EC2_IP=$(terraform output -raw public_ip)
                        ssh -o StrictHostKeyChecking=no ec2-user@$EC2_IP "
                            cd /home/ec2-user/ 
                            docker pull mohamed710/teamavail-app:latest 
                            docker compose up -d --build
                        "
                    '''
                }
            }
        }
    }
}
