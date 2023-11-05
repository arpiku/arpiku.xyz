# Specify the C++ compiler (e.g., g++)
env = Environment(CXX='g++ -std=c++20')

# Specify the source files directory
src_dir = 'src'

# List the source files (assuming all .cpp files in src_dir)
source_files = Glob('%s/*.cpp' % src_dir)

# Define the target executable
target = 'app'

# Define build rules
env.Program(target, source_files)

# Link against Boost libraries
env.Append(LIBS=['boost_system', 'boost_filesystem'])
