"use client";

import { useActionState } from "react";
import { importArchiveAction, type ImportState } from "@/app/(app)/export/actions";
import { Button } from "@/components/ui/button";

export function ImportPanel() {
  const [state, formAction] = useActionState<ImportState | null, FormData>(
    importArchiveAction,
    null,
  );

  return (
    <form
      action={formAction}
      className="border-border bg-surface space-y-4 rounded-lg border p-4"
    >
      <div>
        <label
          htmlFor="import-file"
          className="text-ink mb-1 block text-sm font-medium"
        >
          Archive file (.json or .zip)
        </label>
        <input
          id="import-file"
          name="file"
          type="file"
          accept=".json,.zip,application/json,application/zip"
          required
          className="text-ink file:bg-surface-2 file:text-ink block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:px-3 file:py-1.5 file:text-sm"
        />
      </div>

      <div>
        <label htmlFor="strategy" className="text-ink mb-1 block text-sm font-medium">
          On UUID conflict
        </label>
        <select
          id="strategy"
          name="strategy"
          defaultValue="skip"
          className="border-border bg-surface text-ink rounded-md border px-3 py-2 text-sm"
        >
          <option value="skip">Skip existing records</option>
          <option value="overwrite">Overwrite existing records</option>
          <option value="copy">Create copies with new ids</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" name="intent" value="dryrun" variant="secondary">
          Dry run (preview)
        </Button>
        <Button
          type="submit"
          name="intent"
          value="apply"
          onClick={(e) => {
            if (!window.confirm("Apply this import to your archive?")) {
              e.preventDefault();
            }
          }}
        >
          Apply import
        </Button>
      </div>

      {state?.errors?.length ? (
        <div
          role="alert"
          className="border-danger/40 bg-danger/5 text-danger rounded-md border p-3 text-sm"
        >
          <p className="font-medium">Import could not proceed:</p>
          <ul className="mt-1 list-inside list-disc">
            {state.errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {state?.message ? (
        <p
          className={state.applied ? "text-success text-sm" : "text-ink-muted text-sm"}
        >
          {state.message}
        </p>
      ) : null}

      {state?.plan ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-ink-faint">
              <tr>
                <th className="py-1 pr-4 font-medium">Table</th>
                <th className="py-1 pr-4 font-medium">Incoming</th>
                <th className="py-1 pr-4 font-medium">Conflicts</th>
                <th className="py-1 pr-4 font-medium">Create</th>
                <th className="py-1 pr-4 font-medium">Overwrite</th>
                <th className="py-1 pr-4 font-medium">Copy</th>
                <th className="py-1 pr-4 font-medium">Skip</th>
              </tr>
            </thead>
            <tbody className="text-ink">
              {Object.entries(state.plan.tables)
                .filter(([, p]) => p.incoming > 0)
                .map(([table, p]) => (
                  <tr key={table} className="border-border border-t">
                    <td className="py-1 pr-4">{table}</td>
                    <td className="py-1 pr-4">{p.incoming}</td>
                    <td className="py-1 pr-4">{p.conflicts}</td>
                    <td className="py-1 pr-4">{p.willCreate}</td>
                    <td className="py-1 pr-4">{p.willOverwrite}</td>
                    <td className="py-1 pr-4">{p.willCopy}</td>
                    <td className="py-1 pr-4">{p.willSkip}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </form>
  );
}
