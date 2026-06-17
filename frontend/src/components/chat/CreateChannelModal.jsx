import { Button, Modal } from "@heroui/react";
import { Megaphone } from "lucide-react";
import { useState } from "react";
import { useChatStore } from "../../store/useChatStore";

export function CreateChannelModal({ state }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const createChannel = useChatStore((state) => state.createChannel);

  const handleCreate = async () => {
    if (!name.trim()) return;
    const res = await createChannel({
      name: name.trim(),
      description: description.trim(),
    });
    if (res) {
      setName("");
      setDescription("");
      state.close();
    }
  };

  return (
    <Modal.Root state={state}>
      <Modal.Trigger>
        <Button variant="ghost" size="sm" isIconOnly className="text-foreground shrink-0 size-8">
          <Megaphone className="size-5" />
        </Button>
      </Modal.Trigger>

      <Modal.Backdrop variant="opaque">
        <Modal.Container size="md" scroll="inside" placement="center">
          <Modal.Dialog className="max-h-[85dvh] border border-white/10 bg-[#2a2a2c] text-foreground shadow-2xl">
            <Modal.Header className="flex flex-row items-center justify-between gap-3 border-b border-white/10 pb-3">
              <Modal.Heading className="text-lg font-semibold tracking-tight text-white">
                Create Channel
              </Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>

            <Modal.Body className="isolate pt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Channel Name</label>
                <input
                  type="text"
                  placeholder="e.g. Technology News"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Description</label>
                <textarea
                  placeholder="What will you post here? (Subscribers can only read your posts)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-accent resize-none"
                />
              </div>

              <div className="pt-2">
                <Button
                  fullWidth
                  variant="primary"
                  isDisabled={!name.trim()}
                  onPress={handleCreate}
                  className="h-11 rounded-xl text-sm font-semibold"
                >
                  Create Channel
                </Button>
              </div>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal.Root>
  );
}
