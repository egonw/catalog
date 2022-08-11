const { promises: fs, existsSync } = require('fs')
const path = require('path')
const readline = require('readline')
const { spawn } = require('child_process')
const csv = require('../csv.js')

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

const REPO_ROOT = path.join(__dirname, '..', '..', 'resources')
const PROBLEMS_FILE = path.join(__dirname, 'problems.csv')

const DWC_FIELDS = [
    'scientificNameID',
    'scientificName',
    'scientificNameAuthorship',
    'genericName',
    'intragenericEpithet',
    'specificEpithet',
    'intraspecificEpithet',

    'taxonRank',
    'taxonRemarks',
    'collectionCode',

    'taxonomicStatus',
    'acceptedNameUsageID',
    'acceptedNameUsage',

    'parentNameUsageID',
    'parentNameUsage',
    'kingdom',
    'phylum',
    'class',
    'order',
    'family',
    'subfamily',
    'genus',
    'subgenus',
    'higherClassification',

    'colTaxonID',
    'gbifTaxonID'
]

const DISPLAY_FIELDS = [
    'scientificNameID',
    'taxonRank',
    'scientificName',
    'taxonomicStatus',
    'taxonRemarks',
    'colTaxonID',
    'gbifTaxonID'
]

const GBIF_RANKS = [
    'kingdom',
    'phyllum',
    'class',
    'order',
    'family',
    'genus',
    'species',
    'subspecies',
    'variety'
]

const PREFIX_PATTERN = /^(?:(.+)(?:\|.*)?(?:\n\1.*)+\n?|[\s\S]+)$/

function formatCsv (data) {
    const table = [DWC_FIELDS]

    for (const row in data) {
        table.push(table[0].map(prop => data[row][prop] || ''))
    }

    return csv.format(table, ',')
}

function prompt (question) {
    return new Promise(resolve => { rl.question(question, resolve) })
}

function runGnverifier (names) {
    return new Promise((resolve, reject) => {
        const proc = spawn('gnverifier', ['-s', '1,11', '-M'])
        let stdout = ''
        let stderr = ''
        proc.stdout.on('data', data => { stdout += data })
        proc.stderr.pipe(process.stdout)
        proc.on('close', code => {
            if (code === 0 || code === '0') {
                resolve(stdout)
            } else {
                reject()
            }
        })
        proc.stdin.write(names)
        proc.stdin.end()
    })
}

function shouldBeSkipped (id) {
    return new Promise(resolve => {
        const proc = spawn('xsv', ['search', '-s', '2', `^${id}$`, PROBLEMS_FILE])
        let stdout = ''
        proc.stdout.on('data', data => { stdout += data })
        proc.on('close', code => {
            resolve(stdout.split('\n').length > 2)
        })
    })
}

async function getResources (id) {
    const file = await fs.readFile(path.join(REPO_ROOT, 'txt', id + '.txt'), 'utf-8')
    console.log(`${id}: generating Darwin Core`)
    try {
        const parseFile = require('./txt.js')
        return parseFile(file, id)
    } catch (error) {
        console.log(error)
        await prompt(`${id}: generating Darwin Core failed, retry? `)
        delete require.cache[require.resolve('./txt.js')]
        return getResources(id)
    }
}

function checkResults (resource, classifications) {
    let correct = true
    const missing = []

    for (const id in resource.taxa) {
        const taxon = resource.taxa[id]
        if (taxon.taxonomicStatus !== 'accepted') { continue }

        const missingCol = false // !taxon.colTaxonID
        const missingGbif = GBIF_RANKS.includes(taxon.taxonRank) && !taxon.gbifTaxonID

        if (missingCol || missingGbif) {
            correct = false
            missing.push(taxon)
        }
    }

    if (missing.length) {
        console.table(missing, DISPLAY_FIELDS)
    }

    for (const source in classifications) {
        const match = classifications[source].join('\n').match(PREFIX_PATTERN)
        const prefix = match[1] || ''
        const length = prefix.split('|').length
        if (length < 3) {
            correct = false
            console.log(`Short prefix "${prefix}" (${length} taxa)`)
        }
    }

    return correct
}

async function matchNames (resource) {
    console.log(`${resource.workId}: matching ${resource.id}`)
    const taxa = {}
    const names = []
    for (const id in resource.taxa) {
        const name = resource.taxa[id].scientificName
        taxa[name] = { ...resource.taxa[id] }
        names.push(name)
    }

    const result = await runGnverifier(names.join('\n'))
    const classifications = { '1': [], '11': [] }

    const [header, ...matches] = csv.parse(result)
    for (const match of matches) {
        const name = match[header.indexOf('ScientificName')]
        const source = match[header.indexOf('DataSourceId')]
        const id = match[header.indexOf('TaxonId')]
        const classification = match[header.indexOf('ClassificationPath')]
        const taxon = taxa[name]

        if (source === '1' && !taxon.colTaxonID) {
            taxon.colTaxonID = id
            classifications[source].push(classification)
        }
        if (source === '11' && GBIF_RANKS.includes(taxon.taxonRank) && !taxon.gbifTaxonID) {
            taxon.gbifTaxonID = id
            classifications[source].push(classification)
        }
    }

    const results = {
        ...resource,
        taxa: Object.fromEntries(
            Object.values(resource.taxa).map(
                taxon => [taxon.scientificNameID, taxa[taxon.scientificName]]
            )
        )
    }

    return [results, classifications]
}

async function getMatchedResources (id) {
    const parsed = await getResources(id)
    const resources = []
    for (const resource of parsed) {
        const [results, classifications] = await matchNames(resource)
        const skip = await shouldBeSkipped(resource.id)

        if (!skip) {
            const correct = checkResults(results, classifications)
            let skip = false

            while (true) {
                if (skip) {
                    console.log(`${resource.workId}: skipping ${resource.id}`)
                    resources.push(results)
                    break
                }

                const choice = await prompt(`${resource.workId}: problems found in ${resource.id}. Skip or retry (s/r)? `)

                switch (choice[0]) {
                    case 's':
                    case 'S': {
                        const reason = await prompt('Reason for skipping? ')
                        fs.appendFile(PROBLEMS_FILE, `${resource.workId},${resource.id},""${reason}""`)
                        skip = true
                        break
                    }

                    case 'r':
                    case 'R': {
                        return getMatchedResources(id)
                    }
                }
            }
        }

        resources.push(results)
    }
    return resources
}

async function processWork (id) {
    const resources = await getMatchedResources(id)

    await Promise.all(resources.map((resource, index) => {
        return fs.writeFile(
            path.join(REPO_ROOT, 'dwc', `${resource.file}.csv`),
            formatCsv(Object.values(resource.taxa))
        )
    }))

    rl.close()
}

async function main () {
    const input = await fs.readdir(path.join(REPO_ROOT, 'txt'))
    const output = await fs.readdir(path.join(REPO_ROOT, 'dwc'))
    const ids = input
        .map(file => path.basename(file, '.txt'))
        .sort((a, b) => a.slice(1) - b.slice(1))

    for (const id of ids) {
        if (output.some(file => file.startsWith(id))) {
            continue
        }
        await processWork(id)
    }
}

main().catch(error => {
    console.error(error)
    process.exit(1)
})

process.on('exit', () => {
    process.stdout.write('\n')
})
