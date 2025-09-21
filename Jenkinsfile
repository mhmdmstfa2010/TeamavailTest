pipeline {
    agent any

    environment {
        REDIS_HOST     = "redis"
        REDIS_PORT     = "6379"
        REDIS_PASSWORD = "${REDIS_PASSWORD}"
        DOCKER_IMAGE   = "mohamed710/teamavail-app:latest"
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

        stage('docker build') {
            steps {
                sh """
                    docker pull ${DOCKER_IMAGE} || true
                    docker build --cache-from=${DOCKER_IMAGE} -t ${DOCKER_IMAGE} .
                """
            }
        }

        stage('docker hub login') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'DockerHub_cred', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
                    sh 'echo $DOCKER_PASSWORD | docker login -u $DOCKER_USERNAME --password-stdin'
                }
            }
        }

        // stage('docker push') {
        //     steps { sh "docker push ${DOCKER_IMAGE}" }
        // }

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

        stage('Deploy with docker compose') {
            steps {
                sshagent(['AWS_SSH']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ec2-user@${env.EC2_IP} '
                            cd /home/ec2-user/
                            docker pull ${DOCKER_IMAGE}
                            docker-compose up -d --build
                        '
                    """
                }
            }
        }
    }
}
