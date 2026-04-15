pipeline {
    agent any
    
    options {
        skipDefaultCheckout(true) 
        timeout(time: 1, unit: 'HOURS') 
    }

    environment {
        FRONTEND_IMAGE      = "prudhviraj310/ecommerce-frontend"
        BACKEND_IMAGE       = "prudhviraj310/ecommerce-backend"
        DOCKER_TAG          = "${BUILD_NUMBER}"
        DOCKER_HUB_CREDS_ID = 'docker-hub-creds'
        API_URL             = "http://35.154.134.186:5000/api" 
        NOTIFY_EMAIL        = "prudhviraj7675@gmail.com" 
    }

    stages {
        stage('Cleanup & Prep') {
            steps {
                script {
                    echo "Force clearing existing containers to prevent conflicts..."
                    sh "docker rm -f ecommerce-backend ecommerce-frontend mysql-db || true"
                    deleteDir() 
                    checkout scm 
                }
            }
        }

        stage('Build & Push') {
            steps {
                script {
                    echo "Building and Pushing Images..."
                    sh "docker build -t ${FRONTEND_IMAGE}:${DOCKER_TAG} -f Dockerfile.frontend --build-arg REACT_APP_API_URL=${API_URL} ."
                    sh "docker build -t ${BACKEND_IMAGE}:${DOCKER_TAG} -f Dockerfile.backend ."
                    
                    withCredentials([usernamePassword(credentialsId: "${DOCKER_HUB_CREDS_ID}", passwordVariable: 'PASS', usernameVariable: 'USER')]) {
                        sh "echo '${PASS}' | docker login -u ${USER} --password-stdin"
                        sh "docker push ${FRONTEND_IMAGE}:${DOCKER_TAG}"
                        sh "docker push ${BACKEND_IMAGE}:${DOCKER_TAG}"
                    }
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    echo "Deploying with Compose..."
                    sh "API_URL=${API_URL} docker compose up -d --force-recreate"
                }
            }
        }

        stage('Space Cleanup') {
            steps {
                script {
                    echo "Removing old build images..."
                    // This deletes the specific images just built to save space
                    sh "docker rmi ${FRONTEND_IMAGE}:${DOCKER_TAG} ${BACKEND_IMAGE}:${DOCKER_TAG} || true"
                    // This deletes ALL unused images (extremely helpful for your disk space)
                    sh "docker image prune -af --filter 'until=24h'" 
                }
            }
        }
    }

    post {
        always {
            emailext (
                to: "${env.NOTIFY_EMAIL}",
                subject: "Build ${currentBuild.fullDisplayName} - ${currentBuild.result}",
                body: "Project: ${env.JOB_NAME}\nStatus: ${currentBuild.result}\nLogs: ${env.BUILD_URL}",
                attachLog: true
            )
            cleanWs()
        }
    }
}