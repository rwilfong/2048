"""
Build 2: A desktop version of 2048 using Python's Tkinter library
This version focuses on replicating the core gameplay mechanics and visual style of the original web-based game, but in a standalone application format
"""
import tkinter as tk
import random

# Color configuration
COLORS = {
    0: {"bg": "#cdc1b4", "fg": "#776e65"},
    2: {"bg": "#eee4da", "fg": "#776e65"},
    4: {"bg": "#ede0c8", "fg": "#776e65"},
    8: {"bg": "#f2b179", "fg": "#f9f6f2"},
    16: {"bg": "#f59563", "fg": "#f9f6f2"},
    32: {"bg": "#f67c5f", "fg": "#f9f6f2"},
    64: {"bg": "#f65e3b", "fg": "#f9f6f2"},
    128: {"bg": "#edcf72", "fg": "#f9f6f2"},
    256: {"bg": "#edcc61", "fg": "#f9f6f2"},
    512: {"bg": "#edc850", "fg": "#f9f6f2"},
    1024: {"bg": "#edc53f", "fg": "#f9f6f2"},
    2048: {"bg": "#edc22e", "fg": "#f9f6f2"},
}

class Game2048(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("2048 - Tkinter")
        self.geometry("450x450")
        self.configure(bg="#faf8ef")
        
        # Game state
        self.matrix = [[0] * 4 for _ in range(4)]
        self.cells = []
        
        self.build_ui()
        self.add_new_tile()
        self.add_new_tile()
        self.update_ui()
        
        # Bind arrow keys
        self.bind("<Key>", self.handle_keypress)

    def build_ui(self):
        """Creates the 4x4 grid using Tkinter Frames and Labels."""
        background = tk.Frame(self, bg="#bbada0", bd=10)
        background.pack(pady=20)

        for r in range(4):
            row_cells = []
            for c in range(4):
                cell_frame = tk.Frame(
                    background, bg="#cdc1b4", width=100, height=100
                )
                cell_frame.grid(row=r, column=c, padx=5, pady=5)
                cell_frame.grid_propagate(False) # Prevent frame from shrinking to fit label
                
                cell_label = tk.Label(
                    cell_frame, text="", bg="#cdc1b4", 
                    font=("Helvetica", 28, "bold"), justify=tk.CENTER
                )
                cell_label.place(relx=0.5, rely=0.5, anchor="center")
                row_cells.append(cell_label)
            self.cells.append(row_cells)

    def add_new_tile(self):
        """Finds an empty spot and adds a 2 or 4."""
        empty_cells = [(r, c) for r in range(4) for c in range(4) if self.matrix[r][c] == 0]
        if empty_cells:
            r, c = random.choice(empty_cells)
            self.matrix[r][c] = 2 if random.random() < 0.9 else 4

    def update_ui(self):
        """Updates the text and colors of the grid based on the matrix."""
        for r in range(4):
            for c in range(4):
                val = self.matrix[r][c]
                label = self.cells[r][c]
                
                if val == 0:
                    label.configure(text="", bg=COLORS[0]["bg"])
                    label.master.configure(bg=COLORS[0]["bg"])
                else:
                    color_data = COLORS.get(val, {"bg": "#3c3a32", "fg": "#f9f6f2"})
                    label.configure(
                        text=str(val), 
                        bg=color_data["bg"], 
                        fg=color_data["fg"]
                    )
                    label.master.configure(bg=color_data["bg"])
        self.update_idletasks()

    # --- Matrix Math (Core Logic) ---
    def compress(self, mat):
        """Slides all non-zero tiles to the left."""
        new_mat = [[0] * 4 for _ in range(4)]
        for r in range(4):
            pos = 0
            for c in range(4):
                if mat[r][c] != 0:
                    new_mat[r][pos] = mat[r][c]
                    pos += 1
        return new_mat

    def merge(self, mat):
        """Merges adjacent equal tiles to the left."""
        for r in range(4):
            for c in range(3):
                if mat[r][c] != 0 and mat[r][c] == mat[r][c + 1]:
                    mat[r][c] *= 2
                    mat[r][c + 1] = 0
        return mat

    def reverse(self, mat):
        return [row[::-1] for row in mat]

    def transpose(self, mat):
        return [[mat[c][r] for c in range(4)] for r in range(4)]

    # --- Movement Commands ---
    def move_left(self):
        self.matrix = self.compress(self.matrix)
        self.matrix = self.merge(self.matrix)
        self.matrix = self.compress(self.matrix)

    def move_right(self):
        self.matrix = self.reverse(self.matrix)
        self.move_left()
        self.matrix = self.reverse(self.matrix)

    def move_up(self):
        self.matrix = self.transpose(self.matrix)
        self.move_left()
        self.matrix = self.transpose(self.matrix)

    def move_down(self):
        self.matrix = self.transpose(self.matrix)
        self.matrix = self.reverse(self.matrix)
        self.move_left()
        self.matrix = self.reverse(self.matrix)
        self.matrix = self.transpose(self.matrix)

    # --- Input Handling ---
    def handle_keypress(self, event):
        key = event.keysym
        orig_mat = [row[:] for row in self.matrix] # Copy to check if matrix changed
        
        if key in ["Left", "a"]:
            self.move_left()
        elif key in ["Right", "d"]:
            self.move_right()
        elif key in ["Up", "w"]:
            self.move_up()
        elif key in ["Down", "s"]:
            self.move_down()
        else:
            return

        # Only add a tile if the board actually changed
        if orig_mat != self.matrix:
            self.add_new_tile()
            self.update_ui()
            
            # Basic Game Over check (if no empty spaces, logic could be expanded)
            if not any(0 in row for row in self.matrix):
                print("Board is full! (Game Over logic goes here)")

if __name__ == "__main__":
    app = Game2048()
    app.mainloop()