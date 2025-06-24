let pets = [];

async function fetchPets() {
  const { data, error } = await supabase
    .from('Paws_information')
    .select('*');

  if (error) {
    console.error('Error fetching pets:', error);
    return;
  }

  pets = data;
  renderPets(pets);
}

const supabaseUrl = 'https://refbbidtdyuoviourfre.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlZmJiaWR0ZHl1b3Zpb3VyZnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NTkxODIsImV4cCI6MjA2NjMzNTE4Mn0.em5QwYJjLZuVm5tWxNO-2AsJgutMw5gBQ21NvNY8Skc';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);
const petGrid = document.getElementById("petGrid");
const searchBar = document.getElementById("searchBar");
const modal = document.getElementById("petModal");
const modalContent = document.getElementById("modalContent");
const uploadForm = document.getElementById("uploadForm");
const uploadButton = document.getElementById("uploadButton");
const cancelUpload = document.getElementById("cancelUpload");

function renderPets(petList) {
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
  modalContent.innerHTML = `
    <h2 class="text-2xl font-bold mb-2">${pet.name}</h2>
    <div class="flex overflow-x-auto gap-2 mb-4">
      ${pet.images.map(img => `<img src="${img}" alt="${pet.name}" class="h-32 w-32 object-cover rounded">`).join("")}
    </div>
    <p><strong>Location:</strong> ${pet.location}</p>
    <p><strong>Description:</strong> ${pet.description}</p>
    <p><strong>Poster:</strong> ${pet.poster}</p>
    <p><strong>Phone:</strong> ${pet.phone}</p>
  `;
  modal.classList.remove("hidden");
}

document.querySelectorAll(".close").forEach(btn => {
  btn.onclick = () => modal.classList.add("hidden");
});

searchBar.oninput = (e) => {
  const val = e.target.value.toLowerCase();
  renderPets(pets.filter(p => p.name.toLowerCase().includes(val) || p.location.toLowerCase().includes(val)));
};

uploadButton.onclick = () => uploadForm.classList.remove("hidden");
cancelUpload.onclick = () => uploadForm.classList.add("hidden");

document.getElementById("newPetForm").onsubmit = async function (e) { {
  e.preventDefault();
  const data = new FormData(this);
  const files = data.getAll("images");
  const images = files.map(file => URL.createObjectURL(file));

  const newPet = {
    id: pets.length + 1,
    name: data.get("name"),
    location: data.get("location"),
    poster: data.get("poster"),
    phone: data.get("phone"),
    description: data.get("description"),
    images: images
  };

 const { data: insertedPet, error } = await supabase
  .from('Paws_information')
  .insert([newPet]);

if (error) {
  console.error('Error inserting pet:', error);
  alert('Failed to upload pet.');
  return;
}

pets.unshift(newPet);
renderPets(pets);

  uploadForm.classList.add("hidden");
  this.reset();
};

renderPets(pets);
fetchPets();
