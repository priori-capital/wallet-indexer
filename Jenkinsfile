@Library('priori-shared-lib') _
node {
  cleanWs()
  checkout scm
  wrapper(
    configFilePath: 'config.properties'
  )
}
