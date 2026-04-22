
//Toasts and Modals
export function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast-notification";
    toast.innerHTML = `<span>✅</span> ${message}`;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("show");
    }, 10);

    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 3000); // visible for 3 seconds
}

//modal with "Cancel" and "Confirm" buttons.
export function showConfirmModal(message, onConfirm) {
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    
    backdrop.innerHTML = `
        <div class="modal-box">
            <h3 style="margin-top:0;">Are you sure?</h3>
            <p>${message}</p>
            <div class="modal-actions">
                <button id="modal-cancel" class="secondary-btn">Cancel</button>
                <button id="modal-confirm" class="primary-btn" style="background-color: #e0245e; color: white; border:none;">Delete</button>
            </div>
        </div>
    `;

    document.body.appendChild(backdrop);
    const cancelBtn = document.getElementById("modal-cancel");
    const confirmBtn = document.getElementById("modal-confirm");

    const closeModal = () => {
        backdrop.remove();
    };

    cancelBtn.onclick = closeModal;

    backdrop.onclick = (e) => {
        if (e.target === backdrop) closeModal();
    };

    confirmBtn.onclick = async () => {
        closeModal();
        await onConfirm(); 
    };
}