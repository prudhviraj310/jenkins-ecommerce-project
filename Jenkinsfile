pipeline {
    agent any
    
    options {
        // Keeps the console clean and prevents builds from hanging forever
        timeout(time: 1, unit: 'HOURS')
        skipDefaultCheckout(true) 
    }

    environment {
        FRONTEND_IMAGE = "prudhviraj310/ecommerce-frontend"
        BACKEND_IMAGE  = "prudhviraj310/ecommerce-backend"
        DOCKER_HUB_ID  = 'docker-hub-creds'
        // Updated to your current EC2 IP to fix image/cart issues
        API_URL        = "http://13.201.127.202:5000/api" 
    }

    stages {
        stage('Cleanup & Workspace Prep') {
            steps {
                script {
                    echo "Wiping workspace to fix Git Status 128 errors..."
                    deleteDir() // This MUST be first to clear corrupted git metadata
                    
                    echo "Cleaning up old Docker containers..."
                    sh "docker rm -f ecommerce-backend ecommerce-frontend mysql-db || true"
                    
                    echo "Cloning fresh repository..."
                    checkout scm
                }
            }
        }

        stage('Build & Push') {
            steps {
                script {
                    echo "Building Frontend with API_URL: ${API_URL}"
                    sh "docker build -t ${FRONTEND_IMAGE}:latest -f Dockerfile.frontend --build-arg REACT_APP_API_URL=${API_URL} ."
                    
                    echo "Building Backend..."
                    sh "docker build -t ${BACKEND_IMAGE}:latest -f Dockerfile.backend ."
                    
                    echo "Logging into Docker Hub and Pushing..."
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
                    echo "Deploying application via Docker Compose..."
                    // We pull first to ensure we get the images we just pushed
                    sh "docker compose pull"
                    sh "API_URL=${API_URL} docker compose up -d --force-recreate"
                }
            }
        }
    }

    post {
        success {
            echo "Deployment successful! Access your app at http://13.201.127.202:3000"
        }
        failure {
            echo "Build failed. Check the logs and ensure Docker socket permissions are correct."
        }
    }
}