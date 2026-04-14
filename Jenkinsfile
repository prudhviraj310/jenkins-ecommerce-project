pipeline {
    agent any
    
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
                deleteDir() 
                checkout scm 
            }
        }

        stage('Build & Deploy') {
            steps {
                script {
                    echo "Building and Pushing Images..."
                    // We keep /usr/bin/docker for builds as it worked perfectly
                    sh "/usr/bin/docker build -t ${FRONTEND_IMAGE}:${DOCKER_TAG} -f Dockerfile.frontend --build-arg REACT_APP_API_URL=${API_URL} ."
                    sh "/usr/bin/docker build -t ${BACKEND_IMAGE}:${DOCKER_TAG} -f Dockerfile.backend ."
                    
                    withCredentials([usernamePassword(credentialsId: "${DOCKER_HUB_CREDS_ID}", passwordVariable: 'PASS', usernameVariable: 'USER')]) {
                        sh "echo '${PASS}' | /usr/bin/docker login -u ${USER} --password-stdin"
                        sh "/usr/bin/docker push ${FRONTEND_IMAGE}:${DOCKER_TAG}"
                        sh "/usr/bin/docker push ${BACKEND_IMAGE}:${DOCKER_TAG}"
                    }
                    
                    echo "Deploying to Production..."
                    // SWITCHED TO docker-compose for better compatibility with your environment
                    sh "API_URL=${API_URL} docker-compose up -d --force-recreate"
                    
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
                body: "Project: ${env.JOB_NAME}\nStatus: ${currentBuild.result}\nLogs: ${env.BUILD_URL}",
                attachLog: true
            )
            cleanWs()
        }
    }
}