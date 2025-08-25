// Utility functions for image error handling
function handleImageError(img) {
  // Prevent infinite loop if the fallback also fails
  if (img.getAttribute("data-fallback-used")) {
    return;
  }
  img.setAttribute("data-fallback-used", "true");

  const isProfilePicture = img.classList.contains("profile-picture");

  if (isProfilePicture) {
    // Use the fallback profile SVG file
    img.src = "assets/fallback-profile.svg";
  } else {
    // Use the fallback favicon SVG file
    img.src = "assets/fallback-favicon.svg";
  }

  // Remove the onerror handler to prevent infinite loops
  img.onerror = null;
}
