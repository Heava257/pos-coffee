document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("toggle-sidebar");
  const menuItems = document.querySelectorAll(".menu-item");
  const contentTitle = document.getElementById("content-title");
  const swatches = document.querySelectorAll(".swatch");

  // 1. Sidebar Collapse Toggle
  toggleBtn.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
  });

  // 2. Navigation Clicking Logic
  menuItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();

      // Remove active class from all menu items
      menuItems.forEach((mi) => mi.classList.remove("active"));

      // Add active class to clicked item
      item.classList.add("active");

      // Update content title dynamically
      const pageName = item.querySelector(".menu-text").innerText;
      contentTitle.innerText = `${pageName} Overview`;
    });
  });

  // 3. Theme Dynamic Switching Swatches
  swatches.forEach((swatch) => {
    swatch.addEventListener("click", () => {
      // Remove active state from all swatches
      swatches.forEach((s) => s.classList.remove("active"));

      // Add active state to selected swatch
      swatch.classList.add("active");

      // Get color code and set to CSS Custom Properties
      const selectedColor = swatch.getAttribute("data-primary");
      document.documentElement.style.setProperty("--primary-color", selectedColor);
      document.documentElement.style.setProperty("--sidebar-text-active", selectedColor);
    });
  });
});
