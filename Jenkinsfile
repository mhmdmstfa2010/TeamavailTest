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
                sh 'docker build -t $DOCKER_USERNAME/teamavail-app:latest .'
            }
        }

        stage('docker hub login') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-hub-credentials', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
                    sh 'docker login -u $DOCKER_USERNAME -p $DOCKER_PASSWORD'
                }
            }
        }

        stage('docker push') {
            steps {
                sh 'docker push $DOCKER_USERNAME/teamavail-app:latest'
            }
        }

        stage('terraform init & apply') {
            steps {
                sh '''
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
                            cd /home/ec2-user/ &&
                            docker compose up -d --build
                        "
                    '''
                }
            }
        }
    }
}
