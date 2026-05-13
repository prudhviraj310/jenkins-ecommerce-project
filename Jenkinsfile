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
        // Ensure this IP is your current AWS Public IP
        API_URL        = "http://13.201.127.202:5000/api" 
    }

    stages {
        stage('Cleanup & Workspace Prep') {
            steps {
                script {
                    echo "Cleaning workspace and old containers..."
                    deleteDir() 
                    // Use || true so the pipeline doesn't fail if containers don't exist yet
                    sh "docker rm -f ecommerce-backend ecommerce-frontend mysql-db || true"
                    checkout scm
                }
            }
        }

        stage('Build & Push') {
            steps {
                script {
                    echo "Building and Pushing Images..."
                    // Injects the API_URL into the React frontend during the build
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
                    // Using the absolute path verified on your host (/usr/bin/docker-compose)
                    sh "/usr/bin/docker-compose pull"
                    // Force recreate ensures the new images are used immediately
                    sh "API_URL=${API_URL} /usr/bin/docker-compose up -d --force-recreate"
                }
            }
        }
    }

    post {
        success {
            echo "SUCCESS! Access the app at http://13.201.127.202:3000"
        }
        failure {
            echo "Build failed. Ensure the docker run command included the -v /usr/bin/docker-compose mapping."
        }
    }
}