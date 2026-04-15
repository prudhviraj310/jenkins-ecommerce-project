pipeline {
    agent any
    
    options {
        skipDefaultCheckout(true) 
        timeout(time: 1, unit: 'HOURS') // Good practice to prevent hanging builds
        ansiColor('xterm')
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
        stage('Preparation') {
            steps {
                deleteDir() 
                checkout scm 
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

        stage('Deploy to Production') {
            steps {
                script {
                    echo "Stopping old containers to avoid conflicts..."
                    // 'down' removes containers, networks, and images defined in compose
                    // The '|| true' ensures the pipeline continues if nothing was running
                    sh "docker compose down --remove-orphans || true"
                    
                    echo "Deploying new version..."
                    sh "API_URL=${API_URL} docker compose up -d --force-recreate"
                }
            }
        }

        stage('Post-Build Cleanup') {
            steps {
                echo "Cleaning up local build images to save disk space..."
                sh "docker rmi ${FRONTEND_IMAGE}:${DOCKER_TAG} ${BACKEND_IMAGE}:${DOCKER_TAG} || true"
                // Crucial for your Sonar server issues: clean dangling images
                sh "docker image prune -f"
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