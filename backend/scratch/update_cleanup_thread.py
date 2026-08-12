file_path = r'c:\Users\adhit\Downloads\Ai_DineIn_Management\backend\apps\reservation\services.py'

with open(file_path, 'r', encoding='utf-8') as f:
    code = f.read()

old_thread_block = """            def delayed_cleanup():
                import time
                time.sleep(10)
                from apps.reservation.models import Table
                for t in tables:
                    try:
                        tbl = Table.objects.get(id=t.id)
                        if tbl.status == 'cleaning':
                            tbl.status = 'available'
                            tbl.save()
                    except:
                        pass
            threading.Thread(target=delayed_cleanup, daemon=True).start()"""

new_thread_block = """            def delayed_cleanup():
                import time
                time.sleep(10)
                from django.db import connections
                connections.close_all()
                from apps.reservation.models import Table
                for t in tables:
                    for attempt in range(5):
                        try:
                            tbl = Table.objects.get(id=t.id)
                            if tbl.status == 'cleaning':
                                tbl.status = 'available'
                                tbl.save()
                            break
                        except Exception as ex:
                            logger.error(f"[CLEANING THREAD] Attempt {attempt} failed: {ex}")
                            time.sleep(1)
            threading.Thread(target=delayed_cleanup, daemon=True).start()"""

if old_thread_block in code:
    code = code.replace(old_thread_block, new_thread_block)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(code)
    print("Delayed cleaning thread updated successfully with connection closing and SQLite write retries.")
else:
    print("Error: Could not find exact old_thread_block match.")
