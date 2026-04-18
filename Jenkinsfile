pipeline {
    agent any
    
    environment {
        FRONTEND_IMAGE = "prudhviraj310/ecommerce-frontend"
        BACKEND_IMAGE  = "prudhviraj310/ecommerce-backend"
        DOCKER_HUB_ID  = 'docker-hub-creds'
        API_URL        = "http://3.111.170.86:5000/api" 
    }

    stages {
        stage('Cleanup') {
            steps {
                sh "docker rm -f ecommerce-backend ecommerce-frontend mysql-db || true"
                deleteDir()
                checkout scm
            }
        }

        stage('Build & Push') {
            steps {
                script {
                    // Build images
                    sh "docker build -t ${FRONTEND_IMAGE}:latest -f Dockerfile.frontend --build-arg REACT_APP_API_URL=${API_URL} ."
                    sh "docker build -t ${BACKEND_IMAGE}:latest -f Dockerfile.backend ."
                    
                    // Login and Push
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
                // Using Docker Compose or direct docker run commands to start the stack
                sh "docker compose down || true"
                sh "API_URL=${API_URL} docker compose up -d --force-recreate"
            }
        }
    }
}