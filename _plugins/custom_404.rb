Jekyll::Hooks.register :site, :post_write do |site|
  # This ensures 404.html is built properly
  File.write(File.join(site.dest, "404.html"), site.pages.find { |page| page.name == "404.html" }&.output || "")
end