const { readFile } = require('fs/promises')
const { join, parse, relative, basename } = require('path')

const { glob } = require('glob')
const { paths } = require('govuk-frontend-config')
const yaml = require('js-yaml')
const { minimatch } = require('minimatch')
const slash = require('slash')

const { packageNameToPath } = require('./names')

/**
 * Directory listing for path
 *
 * @param {string} directoryPath - Minimatch pattern to directory
 * @param {import('glob').GlobOptionsWithFileTypesUnset} [options] - Glob options
 * @returns {Promise<string[]>} File paths
 */
const getListing = async (directoryPath, options = {}) => {
  const listing = await glob(slash(directoryPath), {
    absolute: true,
    nodir: true,
    realpath: true,
    ...options
  })

  // Use relative paths
  return listing
    .map((entryPath) =>
      relative(options.cwd?.toString() ?? paths.root, entryPath)
    )
    .sort()
}

/**
 * Directory listing (directories only)
 *
 * @param {string} directoryPath - Minimatch pattern to directory
 * @returns {Promise<string[]>} Directory names
 */
const getDirectories = async (directoryPath) => {
  const listing = await getListing(`${slash(directoryPath)}/*/`, {
    nodir: false
  })

  // Use directory names only
  return listing.map((directoryPath) => basename(directoryPath)).sort()
}

/**
 * Directory listing array filter
 * Returns true for files matching every pattern
 *
 * @param {string[]} patterns - Minimatch patterns
 * @returns {(entryPath: string) => boolean} Returns true for files matching every pattern
 */
const filterPath = (patterns) => (entryPath) => {
  return patterns.every((pattern) => minimatch(entryPath, pattern))
}

/**
 * Directory listing array mapper
 * Runs callback for files matching every pattern
 *
 * @param {string[]} patterns - Minimatch patterns
 * @param {(file: import('path').ParsedPath) => string | string[]} callback - Runs on files matching every pattern
 * @returns {(entryPath: string) => string | string[]} Returns path (or array of paths)
 */
const mapPathTo = (patterns, callback) => (entryPath) => {
  const isMatch = filterPath(patterns)

  // Run callback on files matching every pattern (or original path)
  return isMatch(entryPath) ? callback(parse(entryPath)) : entryPath
}

/**
 * Read config from YAML file
 *
 * @param {string} configPath - File path to config
 * @returns {Promise<any>} Config from YAML file
 */
const getYaml = async (configPath) => {
  return yaml.load(await readFile(configPath, 'utf8'), { json: true })
}

/**
 * Load single component fixtures
 *
 * @param {string} componentName - Component name
 * @returns {Promise<ComponentFixtures>} Component data
 */
const getComponentFixtures = async (componentName) => {
  return require(join(
    packageNameToPath('govuk-frontend'),
    `dist/govuk/components/${componentName}/fixtures.json`
  ))
}

/**
 * Load all components' data
 *
 * @returns {Promise<(ComponentFixtures)[]>} Components' data
 */
const getComponentsFixtures = async () => {
  const componentNames = await getComponentNames()
  return Promise.all(componentNames.map(getComponentFixtures))
}

/**
 * Get component files
 *
 * @param {string} [componentName] - Component name
 * @returns {Promise<string[]>} Component files
 */
const getComponentFiles = (componentName = '') =>
  getListing(
    join(
      packageNameToPath('govuk-frontend'),
      `dist/govuk/components/${componentName}/**/*`
    )
  )

/**
 * Get component names (with optional filter)
 *
 * @param {(componentName: string, componentFiles: string[]) => boolean} [filter] - Component names array filter
 * @returns {Promise<string[]>} Component names
 */
const getComponentNames = async (filter) => {
  const componentNames = await getDirectories(
    join(packageNameToPath('govuk-frontend'), '**/dist/govuk/components/')
  )

  if (filter) {
    const componentFiles = await getComponentFiles()

    // Apply component names filter
    return componentNames.filter((componentName) =>
      filter(componentName, componentFiles)
    )
  }

  return componentNames
}

/**
 * Get examples from component fixtures
 *
 * @param {string} componentName - Component name
 * @returns {Promise<{ [name: string]: ComponentFixture['options'] }>} Component examples as an object
 */
async function getExamples(componentName) {
  const { fixtures } = await getComponentFixtures(componentName)

  /** @type {{ [name: string]: ComponentFixture['options'] }} */
  const examples = {}

  for (const example of fixtures) {
    examples[example.name] = example.options
  }

  return examples
}

module.exports = {
  filterPath,
  getComponentFixtures,
  getComponentsFixtures,
  getComponentFiles,
  getComponentNames,
  getDirectories,
  getExamples,
  getListing,
  getYaml,
  mapPathTo
}

/**
 * Component data
 *
 * @typedef {object} ComponentData
 * @property {ComponentOption[]} [params] - Nunjucks macro option (or param) configs
 * @property {ComponentExample[]} [examples] - Component examples with Nunjucks macro options (or params)
 * @property {string} [previewLayout] - Nunjucks layout for component preview
 * @property {string} [accessibilityCriteria] - Accessibility criteria
 */

/**
 * Nunjucks macro option (or param) config
 *
 * @typedef {object} ComponentOption
 * @property {string} name - Option name
 * @property {'array' | 'boolean' | 'integer' | 'nunjucks-block' | 'object' | 'string'} type - Option type
 * @property {boolean} required - Option required
 * @property {string} description - Option description
 * @property {boolean} [isComponent] - Option is another component
 * @property {ComponentOption[]} [params] - Nunjucks macro option (or param) configs
 */

/**
 * Component examples with Nunjucks macro options (or params)
 *
 * @typedef {object} ComponentExample
 * @property {string} name - Example name
 * @property {string} [description] - Example description
 * @property {boolean} [hidden] - Example hidden from review app
 * @property {string[]} [previewLayoutModifiers] - Component preview layout class modifiers
 * @property {{ [param: string]: unknown }} data - Nunjucks macro options (or params)
 */

/**
 * Component fixture
 * (used by the Design System website)
 *
 * @typedef {object} ComponentFixture
 * @property {string} name - Example name
 * @property {string} description - Example description
 * @property {boolean} hidden - Example hidden from review app
 * @property {string[]} previewLayoutModifiers - Component preview layout class modifiers
 * @property {{ [param: string]: unknown }} options - Nunjucks macro options (or params)
 * @property {string} html - Nunjucks macro rendered HTML
 */

/**
 * Component fixtures
 * (used by the Design System website)
 *
 * @typedef {object} ComponentFixtures
 * @property {string} component - Component name
 * @property {ComponentFixture[]} fixtures - Component fixtures with Nunjucks macro options (or params)
 * @property {string} [previewLayout] - Nunjucks layout for component preview
 */
