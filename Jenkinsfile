// Student Hub — primary CI/CD pipeline
// Runs on a Linux Jenkins agent (Jenkins-in-Docker). See tools/docker-compose.tools.yml.
// Required plugins: OWASP Dependency-Check, SonarQube Scanner, Docker Pipeline.

pipeline {
  agent any

  environment {
    DOCKERHUB      = credentials('dockerhub')          // Jenkins username/password credential
    IMAGE_BACKEND  = "shash1278/studenthub-backend"
    IMAGE_FRONTEND = "shash1278/studenthub-frontend"
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Dependency Check') {                         // <-- the Dependency Check
      steps {
        dependencyCheck additionalArguments: '--scan ./ --format HTML --format XML',
                        odcInstallation: 'dependency-check'
      }
      post {
        always {
          dependencyCheckPublisher pattern: '**/dependency-check-report.xml'
        }
      }
    }

    stage('SonarQube Analysis') {                       // <-- the Security/Vulnerability Check
      steps {
        withSonarQubeEnv('MySonarQube') {
          sh "${tool 'sonar-scanner'}/bin/sonar-scanner"
        }
      }
    }

    stage('Quality Gate') {
      steps {
        timeout(time: 5, unit: 'MINUTES') {
          waitForQualityGate abortPipeline: false       // false = don't fail the demo build
        }
      }
    }

    stage('Docker Build') {
      steps {
        sh 'docker build -t $IMAGE_BACKEND:$BUILD_NUMBER  -t $IMAGE_BACKEND:latest  ./backend'
        sh 'docker build -t $IMAGE_FRONTEND:$BUILD_NUMBER -t $IMAGE_FRONTEND:latest ./frontend'
      }
    }

    stage('Docker Push') {
      steps {
        sh 'echo $DOCKERHUB_PSW | docker login -u $DOCKERHUB_USR --password-stdin'
        sh 'docker push $IMAGE_BACKEND:$BUILD_NUMBER  && docker push $IMAGE_BACKEND:latest'
        sh 'docker push $IMAGE_FRONTEND:$BUILD_NUMBER && docker push $IMAGE_FRONTEND:latest'
      }
    }
  }

  post {
    always  { sh 'docker logout || true' }
    success { echo 'Pipeline complete — images pushed to Docker Hub.' }
    failure { echo 'Pipeline failed — check the stage logs above.' }
  }
}
