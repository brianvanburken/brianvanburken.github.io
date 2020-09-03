Jekyll::Hooks.register(:site, :post_write) do |site|
  next if ENV['JEKYLL_ENV'] != 'production'
  title = "Plugin CSS"

  dest = site.config['destination']
  stylesheet = Dir.glob("#{dest}/assets/*.css").first

  puts "#{title.rjust(18)}: Running PurgeCSS"
  # Temp file to store options. Command line would not accept a series of
  # whitelist classes, and there are a few classes purgecss is missing.
  config_file = 'purgecss.config.js'
  # Make sure the tmp directory exists.
  # Delete existing config file, if it exists.
  File.delete(config_file) if File.exist?(config_file)
  # Configuration JS to write to the file. (Docs: https://www.purgecss.com/configuration)
  config_text = """module.exports = {
    content: ['#{dest}/**/*.html'],
    css: ['#{stylesheet}'],
    output: '#{stylesheet}',
    whitelistPatternsChildren: [/^token/, /^pre/, /^code/]
  }"""
  # Write configuration file.
  File.open(config_file, 'w+') { |f| f.write(config_text) }
  # Run purgecss command.
  system("purgecss -c #{config_file}")
  # Delete generated config file
  File.delete(config_file) if File.exist?(config_file)

  puts "#{title.rjust(18)}: Running CSSO"
  # Run CSSO command to clean up CSS further
  system("csso #{stylesheet} -o #{stylesheet} --force-media-merge")

  puts "#{title.rjust(18)}: Done"
end
