const shell = require('shelljs')
const path = require('path')

const config = require('./config.js')

function exec(command) {
    return new Promise((resolve, reject) => {
        shell.exec(command, /* { shell: config.bashPath }, */ function (code, stdout, stderr) {
            if (stderr) reject(stderr)
            resolve(stdout)
        })
    })
}

// function getCurrentBranchName() {
//     return new Promise((resolve) => {
//         exec('git branch').then((stdout) => {
//             const branchName = stdout.split(/\n/).filter(str => str && ~str.indexOf('*'))[0].split(' ')[1]
//             resolve(branchName)
//             // resolve(stdout.split(' ')[1])
//         })
//     })
// }

function getCurrentBranchName() {
    return new Promise((resolve) => {
        exec('git symbolic-ref --short -q HEAD').then(resolve)
    })
}

async function pushCurrentBranch(branchName) {
    if (!branchName) {
        branchName = await getCurrentBranchName()
    }
    const stdout = await exec(`git push ${config.remoteRepositoryName} ${branchName}`).catch(e=>{
        if(e==='Everything up-to-date\n') return
        throw e
    })
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
    const currentBranchName = await getCurrentBranchName()

    await pushCurrentBranch()
    console.log(`push  ${currentBranchName}`)

    await checkoutTo(mergeBranch)
    console.log(`切换到${mergeBranch}`)

    await pullCurrentBranch(mergeBranch)
    console.log(`pull  ${mergeBranch}`)

    await mergeWith(devBranch)
    console.log(`merge  ${devBranch}`)

    await pushCurrentBranch()
    console.log(`push  ${currentBranchName}`)

    await checkoutTo(devBranch)
    console.log(`切换到${devBranch}`)

    console.log(`已提交到${mergeBranch}，请到GitLab上请求合并分支`)
}

run()