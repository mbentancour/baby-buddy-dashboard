import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DeleteButton from "./DeleteButton";

describe("DeleteButton", () => {
  it("asks for confirmation inline instead of deleting immediately", () => {
    const onDelete = vi.fn();
    render(<DeleteButton onDelete={onDelete} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(screen.getByText("Delete this entry?")).toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it("only calls onDelete after the confirm click", async () => {
    const onDelete = vi.fn().mockResolvedValue();
    render(<DeleteButton onDelete={onDelete} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.click(screen.getByRole("button", { name: /^Delete$|^Deleting/ }));

    await waitFor(() => expect(onDelete).toHaveBeenCalledTimes(1));
  });

  it("cancel returns to the initial state without deleting", () => {
    const onDelete = vi.fn();
    render(<DeleteButton onDelete={onDelete} />);

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByText("Delete this entry?")).not.toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it("disables the initial button when disabled prop is set", () => {
    render(<DeleteButton onDelete={vi.fn()} disabled />);
    expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled();
  });
});
