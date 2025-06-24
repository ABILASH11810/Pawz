const supabase = window.supabase.createClient(
  'https://refbbidtdyuoviourfre.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlZmJiaWR0ZHl1b3Zpb3VyZnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NTkxODIsImV4cCI6MjA2NjMzNTE4Mn0.em5QwYJjLZuVm5tWxNO-2AsJgutMw5gBQ21NvNY8Skc'
);

let pets = [];

async function fetchPets() {
  const { data, error } = await supabase
    .from('Paws_information')
    .select('id, pet_breed, location, user_name, phone_number, description, pet_image');

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
    card.className = "bg-white rounded shadow p-4 relative";

    card.innerHTML = `
      <img src="${pet.pet_image?.[0] || ''}" alt="${pet.pet_breed}" class="w-full h-48 object-cover rounded mb-2">
      <h3 class="font-bold text-lg">${pet.pet_breed}</h3>
      <p>Location: ${pet.location}</p>
      <p>Name: ${pet.user_name}</p>
      <p>Phone no: ${pet.phone_number}</p>
      <div class="flex justify-between mt-3">
        <button class="edit-btn text-blue-600 underline" data-id="${pet.id}">Edit</button>
        <button class="delete-btn text-red-600 underline" data-id="${pet.id}">Delete</button>
      </div>
    `;

    card.onclick = () => openModal(pet);
    petGrid.appendChild(card);
  });

  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const id = btn.getAttribute("data-id");
      const pet = pets.find(p => p.id == id);
      if (!pet) return;

      const imagePaths = pet.pet_image?.map(url => {
        try {
          const parts = new URL(url).pathname.split("/");
          return parts.slice(parts.indexOf("pet-images") + 1).join("/");
        } catch {
          return null;
        }
      }).filter(Boolean);

      if (imagePaths.length > 0) {
        const { error: storageError } = await supabase
          .storage
          .from("pet-images")
          .remove(imagePaths);
        if (storageError) {
          console.error("Storage delete error:", storageError);
          alert("Failed to delete images.");
          return;
        }
      }

      const { error } = await supabase.from("Paws_information").delete().eq("id", id);
      if (error) {
        console.error("Delete failed:", error);
        alert("Failed to delete pet.");
      } else {
        alert("Pet deleted.");
        fetchPets();
      }
    };
  });

  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const id = btn.getAttribute("data-id");
      const pet = pets.find(p => p.id == id);
      if (!pet) return;

      document.querySelector("input[name='name']").value = pet.pet_breed;
      document.querySelector("input[name='location']").value = pet.location;
      document.querySelector("input[name='posted by']").value = pet.user_name;
      document.querySelector("input[name='phone']").value = pet.phone_number;
      document.querySelector("textarea[name='description']").value = pet.description;
      document.getElementById("uploadForm").dataset.editId = id;
      uploadForm.classList.remove("hidden");
    };
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
    <p><strong>Posted by:</strong> ${pet.user_name}</p>
    <p><strong>Phone:</strong> ${pet.phone_number}</p>
  `;
  modal.classList.remove("hidden");
}

window.onload = () => {
  const uploadButton = document.getElementById("uploadButton");
  const uploadForm = document.getElementById("uploadForm");
  const cancelUpload = document.getElementById("cancelUpload");

  document.querySelectorAll(".close").forEach(btn => {
    btn.onclick = () => document.getElementById("petModal").classList.add("hidden");
  });

  uploadButton.onclick = () => {
    uploadForm.classList.remove("hidden");
    uploadForm.removeAttribute("data-edit-id");
    document.getElementById("newPetForm").reset();
  };

  cancelUpload.onclick = () => uploadForm.classList.add("hidden");

  document.getElementById("newPetForm").onsubmit = async function (e) {
    e.preventDefault();
    const formData = new FormData(this);
    const files = formData.getAll("images");
    const editId = uploadForm.dataset.editId;

    const imageUrls = [];

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

    const petData = {
      pet_breed: formData.get("name"),
      location: formData.get("location"),
      user_name: formData.get("posted by"),
      phone_number: formData.get("phone"),
      description: formData.get("description"),
      ...(imageUrls.length > 0 && { pet_image: imageUrls })
    };

    let result;
    if (editId) {
      result = await supabase.from("Paws_information").update(petData).eq("id", editId);
    } else {
      result = await supabase.from("Paws_information").insert([petData]);
    }

    if (result.error) {
      console.error("Save failed:", result.error);
      alert("Pet not saved.");
      return;
    }

    alert(editId ? "Pet updated." : "Pet added.");
    fetchPets();
    uploadForm.classList.add("hidden");
    this.reset();
  };

  fetchPets();
};
