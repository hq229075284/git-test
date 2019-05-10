const shell = require('shelljs')
const path = require('path')

const config = require('./config.js')

function getCurrentBranchName() {
    return new Promise((resolve) => {
        shell.exec('git branch | grep "*"', function (code, stdout, stderr) {
            if (stderr) return
            resolve(stdout.split(' ')[1])
        })
    })
}

function exec(command) {
    return new Promise(resolve => {
        shell.exec(command, function (code, stdout, stderr) {
            if (stderr) reject(stderr)
            resolve(stdout)
        })
    })
}

async function pushCurrentBranch(branchName) {
    if (!branchName) {
        branchName = await getCurrentBranchName()
    }
    const stdout = await exec(`git push ${config.remoteRepositoryName} ${branchName}`)
    return stdout
}

function checkoutTo(targetBranchName) {
    return new Promise((resolve) => {
        if (!targetBranchName) throw new Error('`checkoutTo`需要1个入参')
        exec(`git checkout ${targetBranchName}`).then(() => resolve(targetBranchName))
    })
}

async function pullCurrentBranch(branchName) {
    if (!branchName) {
        branchName = await getCurrentBranchName()
    }
    const stdout = await exec(`git pull ${config.remoteRepositoryName} ${branchName}`)
    return stdout
}

async function mergeWith(targetBranchName) {
    if (!targetBranchName) throw new Error('`mergeWith`需要1个入参')
    await exec(`git merge ${config.remoteRepositoryName} ${targetBranchName}`).catch(e => {
        console.log('merge失败')
        throw e
    })
}

async function run() {
    const { devBranch, mergeBranch } = config
    await pushCurrentBranch()
    await checkoutTo(mergeBranch)
    await pullCurrentBranch(mergeBranch)
    await mergeWith(devBranch)
    await pushCurrentBranch()
    await checkoutTo(devBranch)
    console.log(`已提交到${mergeBranch}，请到GitLab上请求合并分支`)
}

run()