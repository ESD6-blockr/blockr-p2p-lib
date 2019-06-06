#!groovy

@Library('blockr-jenkins-lib') _

String repo = 'blockr-p2p-lib'

Map settings = [
    sonar_key: 'blockr-p2p-lib',
    source_folder: 'src/',
    sonar_exclusions: 'src/main.ts,**/socketIO/**/*,**/__tests__/**/*,**/mocks/**/*',
    archive_folder: ['dist/'],
    skip_tests: false
]

tsBuildAndPublish(repo, settings)
