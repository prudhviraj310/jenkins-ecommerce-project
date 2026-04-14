pipeline {
    agent any
    
    options {
        // Skips the lightweight checkout which was causing the Git 128 error
        skipDefaultCheckout(true) 
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
        stage('Hard Reset Workspace') {
            steps {
                echo "Nuking workspace to fix status 128..."
                deleteDir() 
                // Manually trigger checkout now that workspace is guaranteed clean
                checkout scm 
            }
        }

        stage('Build & Deploy') {
            steps {
                script {
                    echo "Environment Audit..."
                    // Using full path to ensure Docker is found
                    sh "/usr/bin/docker --version"
                    
                    echo "Building Images..."
                    sh "/usr/bin/docker build -t ${FRONTEND_IMAGE}:${DOCKER_TAG} -f Dockerfile.frontend --build-arg REACT_APP_API_URL=${API_URL} ."
                    sh "/usr/bin/docker build -t ${BACKEND_IMAGE}:${DOCKER_TAG} -f Dockerfile.backend ."
                    
                    withCredentials([usernamePassword(credentialsId: "${DOCKER_HUB_CREDS_ID}", passwordVariable: 'PASS', usernameVariable: 'USER')]) {
                        sh "echo '${PASS}' | /usr/bin/docker login -u ${USER} --password-stdin"
                        sh "/usr/bin/docker push ${FRONTEND_IMAGE}:${DOCKER_TAG}"
                        sh "/usr/bin/docker push ${BACKEND_IMAGE}:${DOCKER_TAG}"
                    }
                    
                    echo "Deploying..."
                    // 'docker compose' (with space) is the modern standard for the plugin
                    sh "API_URL=${API_URL} /usr/bin/docker compose up -d --force-recreate"
                    
                    echo "Cleaning up local build images..."
                    sh "/usr/bin/docker rmi ${FRONTEND_IMAGE}:${DOCKER_TAG} ${BACKEND_IMAGE}:${DOCKER_TAG} || true"
                }
            }
        }
    }

    post {
        always {
            emailext (
                to: "${env.NOTIFY_EMAIL}",
                subject: "Build ${currentBuild.fullDisplayName} - ${currentBuild.result}",
                body: "Project: ${env.JOB_NAME}\nBuild: ${env.BUILD_NUMBER}\nStatus: ${currentBuild.result}\nLogs: ${env.BUILD_URL}",
                attachLog: true
            )
            cleanWs()
        }
    }
}