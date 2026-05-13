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
        // CRITICAL: Verify this is your current EC2 Public IP
        API_URL        = "http://13.201.127.202:5000/api" 
    }

    stages {
        stage('Cleanup & Workspace Prep') {
            steps {
                script {
                    echo "Cleaning workspace and removing old containers..."
                    deleteDir() 
                    // Stop old containers to free up ports 3000, 5000, and 3306
                    sh "docker rm -f ecommerce-backend ecommerce-frontend mysql-db || true"
                    checkout scm
                }
            }
        }

        stage('Build & Push') {
            steps {
                script {
                    echo "Building and Pushing Images to Docker Hub..."
                    // Injects the API URL into the React build process
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
                    echo "Installing Standalone Docker Compose & Deploying..."
                    
                    // This block downloads a static binary that works regardless of host settings
                    sh """
                        curl -L "https://github.com/docker/compose/releases/download/v2.26.1/docker-compose-linux-x86_64" -o ./docker-compose
                        chmod +x ./docker-compose
                    """
                    
                    echo "Pulling fresh images..."
                    sh "./docker-compose pull"
                    
                    echo "Launching Application Stack..."
                    sh "API_URL=${API_URL} ./docker-compose up -d --force-recreate"
                }
            }
        }
    }

    post {
        success {
            echo "-----------------------------------------------------------"
            echo "SUCCESS! Your E-commerce app is live."
            echo "Frontend: http://13.201.127.202:3000"
            echo "Backend API: http://13.201.127.202:5000"
            echo "-----------------------------------------------------------"
        }
        failure {
            echo "-----------------------------------------------------------"
            echo "DEPLOYMENT FAILED."
            echo "Check console output above for the specific error."
            echo "-----------------------------------------------------------"
        }
    }
}