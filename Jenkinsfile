pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = 'dockerhub-creds'
        IMAGE_NAME            = 'shash1278/ml-project'
        IMAGE_TAG             = "${env.BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Image') {
            steps {
                bat "docker build -t %IMAGE_NAME%:%IMAGE_TAG% -t %IMAGE_NAME%:latest ."
            }
        }

        stage('Push to Docker Hub') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: "${DOCKERHUB_CREDENTIALS}",
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    bat 'echo %DOCKER_PASS%| docker login -u %DOCKER_USER% --password-stdin'
                    bat "docker push %IMAGE_NAME%:%IMAGE_TAG%"
                    bat "docker push %IMAGE_NAME%:latest"
                    bat 'docker logout'
                }
            }
        }
    }

    post {
        always {
            bat 'docker image prune -f || exit 0'
        }
    }
}
