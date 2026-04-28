const supabase = window.supabaseClient || window.supabase.createClient(
  'https://lkoixnhbnwqztjyxkmdf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxrb2l4bmhibndxenRqeXhrbWRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNTExNDMsImV4cCI6MjA5MjkyNzE0M30.7iyC2i_h6_NUjks5KtOHIUPY30xYrcGpzWIcK74SuXU'
);
window.supabaseClient = supabase;

let pets = [];


async function fetchPets() {
  const { data, error } = await supabase
    .from('Paws_information')
    .select('pet_breed, location, user_name, phone_number, description, pet_image');

  if (error) {
    console.error('Fetch error:', error);
    return;
  }

  console.log("DATA:", data); // 🔍 debug

  pets = data || [];
  renderPets(pets);
}


function renderPets(petList) {
  const petGrid = document.getElementById("petGrid");
  petGrid.innerHTML = "";

  petList.forEach(pet => {
    const images = pet.pet_image || [];

    const card = document.createElement("div");
    card.className = "bg-white rounded shadow cursor-pointer hover:shadow-lg";

    card.innerHTML = `
      <img src="${images[0] || ''}" alt="${pet.pet_breed}" class="w-full h-48 object-cover rounded-t">
      <div class="p-4">
        <h3 class="font-bold text-lg">${pet.pet_breed || 'Unknown'}</h3>
        <p>Location: ${pet.location || '-'}</p>
        <p>Name: ${pet.user_name || '-'}</p>
        <p>Phone: ${pet.phone_number || '-'}</p>
      </div>
    `;

    card.onclick = () => openModal(pet);
    petGrid.appendChild(card);
  });
}

function openModal(pet) {
  const modal = document.getElementById("petModal");
  const modalContent = document.getElementById("modalContent");

  const images = pet.pet_image || [];

  modalContent.innerHTML = `
    <h2 class="text-2xl font-bold mb-2">${pet.pet_breed}</h2>
    <div class="flex overflow-x-auto gap-2 mb-4">
      ${images.map(img => `<img src="${img}" class="h-32 w-32 object-cover rounded">`).join("")}
    </div>
    <p><strong>Location:</strong> ${pet.location}</p>
    <p><strong>Description:</strong> ${pet.description || '-'}</p>
    <p><strong>Poster:</strong> ${pet.user_name}</p>
    <p><strong>Phone:</strong> ${pet.phone_number}</p>
  `;

  modal.classList.remove("hidden");
}


document.addEventListener("DOMContentLoaded", () => {
  const uploadButton = document.getElementById("uploadButton");
  const uploadForm = document.getElementById("uploadForm");
  const cancelUpload = document.getElementById("cancelUpload");

  // Close modal
  document.querySelectorAll(".close").forEach(btn => {
    btn.onclick = () => document.getElementById("petModal").classList.add("hidden");
  });

  uploadButton.onclick = () => uploadForm.classList.remove("hidden");
  cancelUpload.onclick = () => uploadForm.classList.add("hidden");

  document.getElementById("newPetForm").onsubmit = async function (e) {
    e.preventDefault();

    const formData = new FormData(this);
    const files = formData.getAll("images");

    const imageUrls = [];

    for (const file of files) {
      if (!file || file.size === 0) continue;

      const fileName = `${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('pet-images')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Image upload failed:', uploadError);
        alert('Image upload failed');
        return;
      }

      const { data: publicUrlData } = supabase
        .storage
        .from('pet-images')
        .getPublicUrl(fileName);

      imageUrls.push(publicUrlData.publicUrl);
    }


    const newPet = {
      pet_breed: formData.get("pet_breed"),
      location: formData.get("location"),
      user_name: formData.get("user_name"),
      phone_number: formData.get("phone"),
      description: formData.get("description"),
      pet_image: imageUrls
    };

    const { error: insertError } = await supabase
      .from('Paws_information')
      .insert([newPet]);

    if (insertError) {
      console.error('Insert failed:', insertError);
      alert("Pet not uploaded.");
      return;
    }

    pets.unshift(newPet);
    renderPets(pets);

    uploadForm.classList.add("hidden");
    this.reset();
  };

  fetchPets();
});
