pipeline {
    agent any
    
    options {
        timeout(time: 1, unit: 'HOURS')
        skipDefaultCheckout(true) 
    }

    environment {
        FRONTEND_IMAGE = "prudhviraj310/ecommerce-frontend"
        BACKEND_IMAGE  = "prudhviraj310/ecommerce-backend"
        DOCKER_HUB_ID  = 'docker-hub-creds'
        API_URL        = "http://13.201.127.202:5000/api" 
    }

    stages {
        stage('Environment Fix') {
            steps {
                script {
                    echo "Checking for Docker Compose..."
                    def status = sh(script: "docker-compose --version", returnStatus: true)
                    if (status != 0) {
                        echo "Docker Compose not found. Installing locally in container..."
                        sh "curl -L 'https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-linux-x86_64' -o /tmp/docker-compose"
                        sh "chmod +x /tmp/docker-compose"
                        sh "mv /tmp/docker-compose /usr/bin/docker-compose || mkdir -p ~/bin && cp /tmp/docker-compose ~/bin/docker-compose"
                    }
                }
            }
        }

        stage('Cleanup & Workspace Prep') {
            steps {
                script {
                    echo "Cleaning workspace and old containers..."
                    deleteDir() 
                    sh "docker rm -f ecommerce-backend ecommerce-frontend mysql-db || true"
                    checkout scm
                }
            }
        }

        stage('Build & Push') {
            steps {
                script {
                    echo "Building and Pushing Images..."
                    sh "docker build -t ${FRONTEND_IMAGE}:latest -f Dockerfile.frontend --build-arg REACT_APP_API_URL=${API_URL} ."
                    sh "docker build -t ${BACKEND_IMAGE}:latest -f Dockerfile.backend ."
                    
                    withCredentials([usernamePassword(credentialsId: "${DOCKER_HUB_ID}", passwordVariable: 'PASS', usernameVariable: 'USER')]) {
                        sh "echo '${PASS}' | docker login -u ${USER} --password-stdin"
                        sh "docker push ${FRONTEND_IMAGE}:latest"
                        sh "docker push ${BACKEND_IMAGE}:latest"
                    }
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    echo "Deploying via Docker Compose..."
                    // Try the system path first, then the custom path
                    def cmd = sh(script: "command -v docker-compose || echo '~/bin/docker-compose'", returnStdout: true).trim()
                    
                    sh "${cmd} pull"
                    sh "API_URL=${API_URL} ${cmd} up -d --force-recreate"
                }
            }
        }
    }

    post {
        success {
            echo "-----------------------------------------------------------"
            echo "SUCCESS! App is live: http://13.201.127.202:3000"
            echo "-----------------------------------------------------------"
        }
        failure {
            echo "-----------------------------------------------------------"
            echo "DEPLOYMENT FAILED. Check Jenkins Console Output."
            echo "-----------------------------------------------------------"
        }
    }
}