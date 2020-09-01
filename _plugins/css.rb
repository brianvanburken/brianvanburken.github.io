Jekyll::Hooks.register(:site, :post_write) do |_site|
  next if ENV['JEKYLL_ENV'] != 'production'

  # Temp file to store options. Command line would not accept a series of
  # whitelist classes, and there are a few classes purgecss is missing.
  config_file = 'tmp/purgecss.js'
  # Make sure the tmp directory exists.
  FileUtils.mkdir('tmp') unless Dir.exist?('tmp')
  # Delete existing config file, if it exists.
  File.delete(config_file) if File.exist?(config_file)
  # Main css stylesheet
  stylesheet = Dir.glob('build/assets/*.css').first
  # Configuration JS to write to the file. (Docs: https://www.purgecss.com/configuration)
  config_text = """module.exports = #{{
    # Wildcard glob of the site's HTML files.
    content: ['_site/**/*.html'],
    # CSS file in the expected output directory.
    css: [stylesheet],
    # Output in same directory
    output: stylesheet
  }.to_json}"""
  # Write configuration file.
  File.open(config_file, 'w+') { |f| f.write(config_text) }
  # Run purgecss command.
  system("purgecss --config #{config_file}")
  # Clean up
  FileUtils.remove_dir('tmp')

  # Run CSSO command to clean up CSS further
  system("csso #{stylesheet} -o #{stylesheet}")
end
