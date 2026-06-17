import { Button, Modal, Avatar } from "@heroui/react";
import { Plus, Users } from "lucide-react";
import { useState } from "react";
import { useChatStore } from "../../store/useChatStore";

export function CreateGroupModal({ state }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const createGroup = useChatStore((state) => state.createGroup);
  const users = useChatStore((state) => state.users);

  const handleToggleMember = (userId) => {
    if (selectedMembers.includes(userId)) {
      setSelectedMembers(selectedMembers.filter((id) => id !== userId));
    } else {
      setSelectedMembers([...selectedMembers, userId]);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    const res = await createGroup({
      name: name.trim(),
      description: description.trim(),
      members: selectedMembers,
    });
    if (res) {
      setName("");
      setDescription("");
      setSelectedMembers([]);
      state.close();
    }
  };

  return (
    <Modal.Root state={state}>
      <Modal.Trigger>
        <Button variant="ghost" size="sm" isIconOnly className="text-foreground shrink-0 size-8">
          <Users className="size-5" />
        </Button>
      </Modal.Trigger>

      <Modal.Backdrop variant="opaque">
        <Modal.Container size="md" scroll="inside" placement="center">
          <Modal.Dialog className="max-h-[85dvh] border border-white/10 bg-[#2a2a2c] text-foreground shadow-2xl">
            <Modal.Header className="flex flex-row items-center justify-between gap-3 border-b border-white/10 pb-3">
              <Modal.Heading className="text-lg font-semibold tracking-tight text-white">
                Create Group
              </Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>

            <Modal.Body className="isolate pt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Group Name</label>
                <input
                  type="text"
                  placeholder="e.g. Project Team"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Description</label>
                <textarea
                  placeholder="What is this group about?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-accent resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">Add Members</label>
                <div className="max-h-48 overflow-y-auto space-y-2 border border-white/10 rounded-xl p-2 bg-white/5">
                  {users.length === 0 ? (
                    <p className="text-center text-xs text-zinc-500 py-4">No users available to add</p>
                  ) : (
                    users.map((user) => {
                      const isSelected = selectedMembers.includes(user._id);
                      return (
                        <div
                          key={user._id}
                          onClick={() => handleToggleMember(user._id)}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                            isSelected ? "bg-accent/15 border border-accent/30" : "hover:bg-white/5 border border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Avatar className="size-8">
                              <Avatar.Image src={user.profilePic} alt={user.fullName} />
                              <Avatar.Fallback className="text-xs">
                                {user.fullName.split(" ").map(n => n[0]).join("")}
                              </Avatar.Fallback>
                            </Avatar>
                            <div>
                              <p className="text-xs font-semibold text-white">{user.fullName}</p>
                              <p className="text-[10px] text-zinc-400">{user.email}</p>
                            </div>
                          </div>
                          <div className={`size-4.5 rounded-full border flex items-center justify-center transition-colors ${
                            isSelected ? "bg-accent border-accent text-white" : "border-white/20"
                          }`}>
                            {isSelected && <Plus className="size-3 rotate-45" />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="pt-2">
                <Button
                  fullWidth
                  variant="primary"
                  isDisabled={!name.trim()}
                  onPress={handleCreate}
                  className="h-11 rounded-xl text-sm font-semibold"
                >
                  Create Group
                </Button>
              </div>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal.Root>
  );
}
