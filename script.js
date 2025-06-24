""const supabase = window.supabase.createClient(
  'https://refbbidtdyuoviourfre.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlZmJiaWR0ZHl1b3Zpb3VyZnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NTkxODIsImV4cCI6MjA2NjMzNTE4Mn0.em5QwYJjLZuVm5tWxNO-2AsJgutMw5gBQ21NvNY8Skc'
);

let pets = [];

async function fetchPets() {
  const { data, error } = await supabase
    .from('Paws_information')
    .select('*');

  if (error) {
    console.error('Fetch error:', error);
    return;
  }

  pets = data;
  renderPets(pets);
}

function renderPets(petList) {
  const petGrid = document.getElementById("petGrid");
  petGrid.innerHTML = "";
  petList.forEach(pet => {
    const card = document.createElement("div");
    card.className = "bg-white rounded shadow cursor-pointer hover:shadow-lg";
    card.innerHTML = `
      <img src="${pet.pet_image?.[0] || ''}" alt="${pet.pet_breed}" class="w-full h-48 object-cover rounded-t">
      <div class="p-4">
        <h3 class="font-bold text-lg">${pet.pet_breed}</h3>
        <p>Location: ${pet.location}</p>
        <p>Name: ${pet.user_name}</p>
        <p>Phone no: ${pet.phone_number}</p>
      </div>
    `;
    card.onclick = () => openModal(pet);
    petGrid.appendChild(card);
  });
}

function openModal(pet) {
  const modal = document.getElementById("petModal");
  const modalContent = document.getElementById("modalContent");
  modalContent.innerHTML = `
    <h2 class="text-2xl font-bold mb-2">${pet.pet_breed}</h2>
    <div class="flex overflow-x-auto gap-2 mb-4">
      ${pet.pet_image.map(img => `<img src="${img}" class="h-32 w-32 object-cover rounded">`).join("")}
    </div>
    <p><strong>Location:</strong> ${pet.location}</p>
    <p><strong>Description:</strong> ${pet.description}</p>
    <p><strong>Poster:</strong> ${pet.user_name}</p>
    <p><strong>Phone:</strong> ${pet.phone_number}</p>
    <div class="flex justify-end gap-2 mt-4">
      <button onclick="deletePet('${pet.id}', ${JSON.stringify(pet.pet_image)})" class="bg-red-500 text-white px-4 py-2 rounded">Delete</button>
      <button onclick="editPet(${encodeURIComponent(JSON.stringify(pet))})" class="bg-yellow-500 text-white px-4 py-2 rounded">Edit</button>
    </div>
  `;
  modal.classList.remove("hidden");
}

async function deletePet(id, imageUrls) {
  const confirmDelete = confirm("Are you sure you want to delete this pet?");
  if (!confirmDelete) return;

  // Delete from storage
  for (const url of imageUrls) {
    const path = decodeURIComponent(new URL(url).pathname.split("/pet-images/")[1]);
    await supabase.storage.from("pet-images").remove([path]);
  }

  const { error } = await supabase.from("Paws_information").delete().eq("id", id);
  if (error) {
    console.error("Delete error:", error);
    alert("Failed to delete pet.");
  } else {
    pets = pets.filter(p => p.id !== id);
    renderPets(pets);
    document.getElementById("petModal").classList.add("hidden");
  }
}

function editPet(encodedPet) {
  const pet = JSON.parse(decodeURIComponent(encodedPet));
  document.getElementById("uploadForm").classList.remove("hidden");

  const form = document.getElementById("newPetForm");
  form.dataset.editId = pet.id;
  form.querySelector("[name='name']").value = pet.pet_breed;
  form.querySelector("[name='location']").value = pet.location;
  form.querySelector("[name='posted by']").value = pet.user_name;
  form.querySelector("[name='phone']").value = pet.phone_number;
  form.querySelector("[name='description']").value = pet.description;
}

window.onload = () => {
  const uploadButton = document.getElementById("uploadButton");
  const uploadForm = document.getElementById("uploadForm");
  const cancelUpload = document.getElementById("cancelUpload");

  document.querySelectorAll(".close").forEach(btn => {
    btn.onclick = () => document.getElementById("petModal").classList.add("hidden");
  });

  uploadButton.onclick = () => {
    document.getElementById("newPetForm").reset();
    delete document.getElementById("newPetForm").dataset.editId;
    uploadForm.classList.remove("hidden");
  };

  cancelUpload.onclick = () => uploadForm.classList.add("hidden");

  document.getElementById("newPetForm").onsubmit = async function (e) {
    e.preventDefault();
    const formData = new FormData(this);
    const files = formData.getAll("images");

    let imageUrls = [];
    for (const file of files) {
      const fileName = `${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
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
      pet_breed: formData.get("name"),
      location: formData.get("location"),
      user_name: formData.get("posted by"),
      phone_number: formData.get("phone"),
      description: formData.get("description"),
      pet_image: imageUrls
    };

    let insertError;
    const editingId = this.dataset.editId;
    if (editingId) {
      const { error } = await supabase.from("Paws_information").update(newPet).eq("id", editingId);
      insertError = error;
    } else {
      const { error } = await supabase.from("Paws_information").insert([newPet]);
      insertError = error;
    }

    if (insertError) {
      console.error("Insert/Update failed:", insertError);
      alert("Pet not uploaded.");
      return;
    }

    fetchPets();
    uploadForm.classList.add("hidden");
    this.reset();
    delete this.dataset.editId;
  };

  fetchPets();
};
