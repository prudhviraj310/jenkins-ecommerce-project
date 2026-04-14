pipeline {
    agent any
    
    // This forced option does the same thing as unchecking "Lightweight Checkout"
    options {
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
                deleteDir() // This clears the "haunted" folder
                
                // Now we manually trigger the checkout since we skipped the default one
                checkout scm 
            }
        }

        stage('Build & Deploy') {
            steps {
                script {
                    echo "Environment Audit..."
                    sh "docker --version && docker compose version"
                    
                    echo "Building Images..."
                    sh "docker build -t ${FRONTEND_IMAGE}:${DOCKER_TAG} -f Dockerfile.frontend --build-arg REACT_APP_API_URL=${API_URL} ."
                    sh "docker build -t ${BACKEND_IMAGE}:${DOCKER_TAG} -f Dockerfile.backend ."
                    
                    withCredentials([usernamePassword(credentialsId: "${DOCKER_HUB_CREDS_ID}", passwordVariable: 'PASS', usernameVariable: 'USER')]) {
                        sh "echo '${PASS}' | docker login -u ${USER} --password-stdin"
                        sh "docker push ${FRONTEND_IMAGE}:${DOCKER_TAG}"
                        sh "docker push ${BACKEND_IMAGE}:${DOCKER_TAG}"
                    }
                    
                    echo "Deploying..."
                    sh "API_URL=${API_URL} docker compose up -d --force-recreate"
                }
            }
        }
    }

    post {
        always {
            emailext (
                to: "${env.NOTIFY_EMAIL}",
                subject: "Build ${currentBuild.fullDisplayName} - ${currentBuild.result}",
                body: "Check logs: ${env.BUILD_URL}",
                attachLog: true
            )
            cleanWs()
        }
    }
}