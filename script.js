const supabase = supabase.createClient(
  'https://refbbidtdyuoviourfre.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlZmJiaWR0ZHl1b3Zpb3VyZnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NTkxODIsImV4cCI6MjA2NjMzNTE4Mn0.em5QwYJjLZuVm5tWxNO-2AsJgutMw5gBQ21NvNY8Skc'
);

let pets = [];

async function fetchPets() {
  const { data, error } = await supabase.from('Paws_information').select('*');
  if (error) return console.error('Fetch error:', error);
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
      <img src="${pet.images[0]}" alt="${pet.name}" class="w-full h-48 object-cover rounded-t">
      <div class="p-4">
        <h3 class="font-bold text-lg">${pet.name}</h3>
        <p>Location: ${pet.location}</p>
        <p>Name: ${pet.poster}</p>
        <p>Phone no: ${pet.phone}</p>
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
    <h2 class="text-2xl font-bold mb-2">${pet.name}</h2>
    <div class="flex overflow-x-auto gap-2 mb-4">
      ${pet.images.map(img => `<img src="${img}" class="h-32 w-32 object-cover rounded">`).join("")}
    </div>
    <p><strong>Location:</strong> ${pet.location}</p>
    <p><strong>Description:</strong> ${pet.description}</p>
    <p><strong>Poster:</strong> ${pet.poster}</p>
    <p><strong>Phone:</strong> ${pet.phone}</p>
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

  uploadButton.onclick = () => uploadForm.classList.remove("hidden");
  cancelUpload.onclick = () => uploadForm.classList.add("hidden");

  document.getElementById("newPetForm").onsubmit = async function (e) {
    e.preventDefault();
    const data = new FormData(this);
    const files = data.getAll("images");

    // ✅ Upload image to Supabase Storage
    const imageUrls = [];

    for (const file of files) {
      const fileName = `${Date.now()}-${file.name}`;
      const { data: imgData, error: uploadError } = await supabase.storage
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
      name: data.get("name"),
      location: data.get("location"),
      poster: data.get("poster"),
      phone: data.get("phone"),
      description: data.get("description"),
      images: imageUrls
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
};
